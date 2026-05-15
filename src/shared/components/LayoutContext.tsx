/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

interface LayoutContextType {
  collapsed: boolean
  setCollapsed: (val: boolean) => void
}

const LayoutContext = createContext<LayoutContextType>({
  collapsed: false,
  setCollapsed: () => {},
})

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}