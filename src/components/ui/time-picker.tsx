import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  const [selectedHours, setSelectedHours] = useState<string>(
    date ? String(date.getHours()).padStart(2, "0") : "12"
  );
  const [selectedMinutes, setSelectedMinutes] = useState<string>(
    date ? String(date.getMinutes()).padStart(2, "0") : "00"
  );

  useEffect(() => {
    if (!date) return;
    
    const newDate = new Date(date);
    newDate.setHours(parseInt(selectedHours));
    newDate.setMinutes(parseInt(selectedMinutes));
    setDate(newDate);
  }, [selectedHours, selectedMinutes, date, setDate]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hours = parseInt(e.target.value);
    
    if (isNaN(hours)) {
      setSelectedHours("00");
      return;
    }
    
    if (hours < 0) hours = 0;
    if (hours > 23) hours = 23;
    
    setSelectedHours(String(hours).padStart(2, "0"));
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let minutes = parseInt(e.target.value);
    
    if (isNaN(minutes)) {
      setSelectedMinutes("00");
      return;
    }
    
    if (minutes < 0) minutes = 0;
    if (minutes > 59) minutes = 59;
    
    setSelectedMinutes(String(minutes).padStart(2, "0"));
  };

  const incrementHours = () => {
    const hours = (parseInt(selectedHours) + 1) % 24;
    setSelectedHours(String(hours).padStart(2, "0"));
  };

  const decrementHours = () => {
    const hours = (parseInt(selectedHours) - 1 + 24) % 24;
    setSelectedHours(String(hours).padStart(2, "0"));
  };

  const incrementMinutes = () => {
    const minutes = (parseInt(selectedMinutes) + 1) % 60;
    setSelectedMinutes(String(minutes).padStart(2, "0"));
  };

  const decrementMinutes = () => {
    const minutes = (parseInt(selectedMinutes) - 1 + 60) % 60;
    setSelectedMinutes(String(minutes).padStart(2, "0"));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? (
            `${selectedHours}:${selectedMinutes}`
          ) : (
            <span>Pick a time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex gap-4 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={incrementHours}
            >
              ▲
            </Button>
            <Input
              className="h-10 w-14 text-center text-lg"
              value={selectedHours}
              onChange={handleHoursChange}
              type="text"
              inputMode="numeric"
              maxLength={2}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={decrementHours}
            >
              ▼
            </Button>
            <Label className="text-xs text-center">Hours</Label>
          </div>
          <div className="text-2xl font-bold">:</div>
          <div className="flex flex-col items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={incrementMinutes}
            >
              ▲
            </Button>
            <Input
              className="h-10 w-14 text-center text-lg"
              value={selectedMinutes}
              onChange={handleMinutesChange}
              type="text"
              inputMode="numeric"
              maxLength={2}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={decrementMinutes}
            >
              ▼
            </Button>
            <Label className="text-xs text-center">Minutes</Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
