"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  clearable?: boolean
}

export function DateTimePicker({ date, setDate, label = "Date & Time", clearable = false }: DateTimePickerProps) {
  // Format the date for the input value
  const getFormattedDateTime = (date: Date | undefined) => {
    if (!date) return ""
    
    // Format as YYYY-MM-DDThh:mm (format required by datetime-local input)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    if (!value && clearable) {
      setDate(undefined)
      return
    }
    
    // Create a new date from the input value
    if (value) {
      const newDate = new Date(value)
      if (!isNaN(newDate.getTime())) {
        setDate(newDate)
      }
    }
  }

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor="datetime-picker">{label}</Label>}
      <Input
        id="datetime-picker"
        type="datetime-local"
        value={getFormattedDateTime(date)}
        onChange={handleChange}
        className="w-full"
      />
      {clearable && date && (
        <button 
          onClick={() => setDate(undefined)}
          className="text-xs text-gray-500 hover:text-gray-700 text-right"
          type="button"
        >
          Clear
        </button>
      )}
    </div>
  )
}

