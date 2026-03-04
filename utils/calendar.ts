import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

// Lấy dữ liệu ngày tháng cho một tháng cụ thể, trả về mảng 2 chiều đại diện cho các tuần
export const getMonthData = (year: number, month: number): number[][] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const weeks: number[][] = [];
    let week: number[] = [];

    // điền số ngày của tháng trước
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        week.push(-(prevMonthDays - i)); // dùng số âm để đánh dấu ngày của tháng trước - Negative = prev month
    }

    // điền số ngày của tháng hiện tại
    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }

    // điền số ngày của tháng sau
    if (week.length > 0) {
        const remaining = 7 - week.length;
        for (let i = 1; i <= remaining; i++) {
            week.push(-(i + 100)) // dùng số âm lớn hơn 100 để đánh dấu ngày của tháng sau - Negative + 100 = next month
        }
        weeks.push(week);
    }

    return weeks;
}

// Lấy tất cả các ngày trong tuần của một ngày cụ thể
export const getWeekDates = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));

    return Array.from({ length: 7}, (_, i) => {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        return d;
    })
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() && 
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    )
}

// format ngày tháng theo định dạng mong muốn
export const formatDate = (date: Date, format: 'full' | 'short' | 'month'): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (format === 'full') {
        return `${days[date.getDay()]}, ${months[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
    } else if (format === 'short') {
        return `${months[date.getMonth()]} ${date.getFullYear}`;
    }
    return shortMonths[date.getMonth()];
}

// lấy sự kiện của một ngày cụ thể
export const getEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    return events.filter(event => isSameDay(new Date(event.startTime), date));
};

export const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}