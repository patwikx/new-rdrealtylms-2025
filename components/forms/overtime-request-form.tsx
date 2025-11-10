"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Loader2, ChevronDownIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { submitOvertimeRequest } from "@/lib/actions/request-actions";
import Link from "next/link";

interface OvertimeRequestFormProps {
  businessUnitId: string;
}

export function OvertimeRequestForm({ businessUnitId }: OvertimeRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  
  // Start time state
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  
  // End time state
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");

  const handleDateCalendarSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setDatePopoverOpen(false);
  };

  // Convert 12-hour format to 24-hour format for storage
  const convert12To24 = (hour: string, minute: string, period: "AM" | "PM"): string => {
    if (!hour || !minute) return "";
    
    let hour24 = parseInt(hour, 10);
    
    if (period === "AM") {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  // Get formatted time strings
  const startTime24 = convert12To24(startHour, startMinute, startPeriod);
  const endTime24 = convert12To24(endHour, endMinute, endPeriod);

  // Check if times are valid and end is after start
  const isValidTimeRange = () => {
    if (!startTime24 || !endTime24) return false;
    return startTime24 < endTime24;
  };

  // Generate hour options (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Generate minute options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleSubmit = async (formData: FormData) => {
    if (!selectedDate || !startHour || !startMinute || !endHour || !endMinute) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate that end time is after start time
    if (!isValidTimeRange()) {
      toast.error("End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    
    // Format date without timezone conversion to avoid date shifting
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Combine date and time for both start and end (same date)
    const dateStr = formatDateLocal(selectedDate);
    const startDateTime = `${dateStr}T${startTime24}`;
    const endDateTime = `${dateStr}T${endTime24}`;
    
    formData.set("startTime", startDateTime);
    formData.set("endTime", endDateTime);
    
    const result = await submitOvertimeRequest(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      router.push(`/${businessUnitId}`);
    }
    
    setIsSubmitting(false);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
          {/* Policy Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Policy Reminder</p>
              <p className="text-blue-800 dark:text-blue-200">
                All overtime work must be pre-approved by your manager as per company policy. 
                Please ensure you have received approval before working overtime hours.
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label htmlFor="date-picker" className="px-1">Overtime Date</Label>
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  id="date-picker"
                  className={cn(
                    "w-full h-12 justify-between font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  captionLayout="dropdown"
                  onSelect={handleDateCalendarSelect}
                  fromYear={new Date().getFullYear() - 1}
                  toYear={new Date().getFullYear() + 1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Time Period</Label>
            
            {/* Start Time */}
            <div className="space-y-3">
              <Label className="text-sm px-1">Start Time</Label>
              <div className="flex gap-2 items-center">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Hr" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <span className="text-muted-foreground">:</span>
                
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={startPeriod} onValueChange={(value: "AM" | "PM") => setStartPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-3">
              <Label className="text-sm px-1">End Time</Label>
              <div className="flex gap-2 items-center">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Hr" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <span className="text-muted-foreground">:</span>
                
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={endPeriod} onValueChange={(value: "AM" | "PM") => setEndPeriod(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration Display */}
            {startHour && startMinute && endHour && endMinute && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Clock className="inline h-4 w-4 mr-2" />
                Duration: {startHour}:{startMinute} {startPeriod} - {endHour}:{endMinute} {endPeriod}
                {!isValidTimeRange() && (
                  <span className="text-destructive ml-2">⚠ End time must be after start time</span>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for Overtime</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Please provide a reason for your overtime request..."
              required
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/${businessUnitId}`}>Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedDate || !startHour || !startMinute || !endHour || !endMinute || !isValidTimeRange()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
    </form>
  );
}