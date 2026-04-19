import API_BASE_URL from '@/config/api';
import type { CalendarEvent, ParticipantOption } from '@/types/calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalendarViewQuery = 'day' | 'week' | 'month' | 'year';

interface CalendarParticipantApi {
    id: string;
    type: 'friend' | 'group';
    userId?: string;
    groupId?: string;
    name: string;
    avatar?: string | null;
}

interface CalendarEventApi {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    color: string;
    location?: string;
    category: 'personal' | 'meeting' | 'reminder' | 'other';
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    notificationMinutes: number;
    isAllDay?: boolean;
    participants?: CalendarParticipantApi[];
    createdAt?: string;
    updatedAt?: string;
}

interface ParticipantOptionsResponse {
    friends: ParticipantOption[];
    groups: ParticipantOption[];
}

const buildUrl = (
    path: string,
    params?: Record<string, string | undefined>,
) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });
    }
    return url.toString();
};

const toJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
    }
    return (await response.json()) as T;
};

const getAuthToken = async () => {
    const tokenCandidates = [
        await AsyncStorage.getItem('auth_token'),
        await AsyncStorage.getItem('token'),
        await AsyncStorage.getItem('accessToken'),
    ];

    return tokenCandidates.find((item) => !!item) || null;
};

const authFetch = async (url: string, init?: RequestInit) => {
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // CRITICAL: Always send X-Platform header for session validation
    headers.set('X-Platform', 'mobile');

    return fetch(url, {
        ...init,
        headers,
    });
};

const toCalendarEvent = (item: CalendarEventApi): CalendarEvent => ({
    id: item.id,
    title: item.title,
    description: item.description,
    start: item.start,
    end: item.end,
    color: item.color,
    location: item.location,
    category:
        item.category === 'meeting' ||
        item.category === 'reminder' ||
        item.category === 'other'
            ? item.category
            : 'personal',
    recurrence: item.recurrence,
    notificationMinutes: item.notificationMinutes,
    isAllDay: item.isAllDay,
    participants: (item.participants || []).map((participant) => ({
        id: participant.id,
        type: participant.type,
        name: participant.name,
        avatar:
            participant.avatar ||
            'https://picsum.photos/seed/calendar-user/120',
        userId: participant.userId,
        groupId: participant.groupId,
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

const toPayload = (event: Partial<CalendarEvent>) => ({
    title: event.title,
    startTime: event.start,
    endTime: event.end,
    description: event.description || '',
    location: event.location || '',
    color: event.color || '#008080',
    category: event.category || 'personal',
    recurrence: event.recurrence || 'none',
    notificationMinutes: event.notificationMinutes ?? 30,
    isAllDay: event.isAllDay ?? false,
    participants: (event.participants || []).map((participant) => ({
        type: participant.type,
        userId: participant.userId,
        groupId: participant.groupId,
        displayName: participant.name,
        avatarUrl: participant.avatar,
    })),
});

export const calendarApi = {
    async getEvents(query: {
        view: CalendarViewQuery;
        date: string;
        q?: string;
    }): Promise<CalendarEvent[]> {
        const response = await authFetch(
            buildUrl('/calendar-events', {
                view: query.view,
                date: query.date,
                q: query.q?.trim() || undefined,
            }),
        );
        const rows = await toJson<CalendarEventApi[]>(response);
        return rows.map(toCalendarEvent);
    },

    async createEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
        const response = await authFetch(buildUrl('/calendar-events'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toPayload(payload)),
        });
        const row = await toJson<CalendarEventApi>(response);
        return toCalendarEvent(row);
    },

    async updateEvent(
        eventId: string,
        payload: Partial<CalendarEvent>,
    ): Promise<CalendarEvent> {
        const response = await authFetch(
            buildUrl(`/calendar-events/${eventId}`),
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toPayload(payload)),
            },
        );
        const row = await toJson<CalendarEventApi>(response);
        return toCalendarEvent(row);
    },

    async deleteEvent(eventId: string): Promise<void> {
        await toJson<{ success: boolean }>(
            await authFetch(buildUrl(`/calendar-events/${eventId}`), {
                method: 'DELETE',
            }),
        );
    },

    async getParticipantOptions(q?: string): Promise<ParticipantOption[]> {
        const response = await authFetch(
            buildUrl('/calendar-events/participant-options', {
                q: q?.trim() || undefined,
            }),
        );
        const data = await toJson<ParticipantOptionsResponse>(response);
        return [...data.friends, ...data.groups];
    },
};
