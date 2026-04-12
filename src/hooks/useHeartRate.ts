'use client'

// Web Bluetooth API type declarations (not in standard TS lib)
declare global {
  interface Navigator {
    bluetooth?: any
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'

interface HeartRateState {
  isSupported: boolean
  isConnecting: boolean
  isConnected: boolean
  heartRate: number | null
  deviceName: string | null
  error: string | null
}

export function useHeartRate() {
  const [state, setState] = useState<HeartRateState>({
    isSupported: false,
    isConnecting: false,
    isConnected: false,
    heartRate: null,
    deviceName: null,
    error: null
  })
  
  const deviceRef = useRef<any>(null)
  const charRef = useRef<any>(null)

  useEffect(() => {
    setState(prev => ({
      ...prev,
      isSupported: typeof navigator !== 'undefined' && !!navigator.bluetooth
    }))
  }, [])

  const parseHeartRate = (value: DataView): number => {
    const flags = value.getUint8(0)
    if (flags & 0x01) {
      return value.getUint16(1, true)
    }
    return value.getUint8(1)
  }

  const connect = useCallback(async () => {
    if (!state.isSupported || !navigator.bluetooth) {
      setState(prev => ({ ...prev, error: 'Web Bluetooth non supportato. Su iPhone usa il browser "Bluefy" (gratis su App Store).' }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['heart_rate']
      })

      deviceRef.current = device
      setState(prev => ({ ...prev, deviceName: device.name || 'Dispositivo BLE' }))

      device.addEventListener('gattserverdisconnected', () => {
        setState(prev => ({ ...prev, isConnected: false, heartRate: null }))
      })

      const server = await device.gatt!.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      
      charRef.current = characteristic

      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const hr = parseHeartRate(event.target.value)
        setState(prev => ({ ...prev, heartRate: hr }))
      })

      await characteristic.startNotifications()
      
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }))
    } catch (err: any) {
      const msg = err.message?.includes('cancelled') 
        ? 'Connessione annullata' 
        : err.message || 'Errore connessione BLE'
      setState(prev => ({ ...prev, isConnecting: false, error: msg }))
    }
  }, [state.isSupported])

  const disconnect = useCallback(async () => {
    try {
      if (charRef.current) {
        await charRef.current.stopNotifications()
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect()
      }
    } catch (err) {
      // ignore 
    }
    setState(prev => ({ ...prev, isConnected: false, heartRate: null, deviceName: null }))
  }, [])

  return { ...state, connect, disconnect }
}
