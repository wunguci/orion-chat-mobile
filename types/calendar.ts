export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    participants?: Participant[];
    color: 'cyan' | 'pink' | 'purple' | 'blue' | 'green' | 'orange';
    isActive?: boolean;
    description?: string; 
}

export interface Participant {
    id: string;
    name: string;
    avatar: string;
}

export type ViewMode = 'day' | 'week' | 'month' | 'year';

export interface DayEventInfo {
    date: Date;
    events: CalendarEvent[];
}

export interface MonthData {
    month: number;
    year: number;
    weeks: number[][];
}