import { WeekDays } from "../enums/week-day-enum";

export function getCurrentTimestamp() {
    const now = new Date();

    const dayOfWeek = WeekDays[
        Object.keys(WeekDays)[now.getDay()] as keyof typeof WeekDays
    ];

    return `${dayOfWeek}, ${now.toLocaleDateString("pt-BR")}, ${now.toLocaleTimeString("pt-BR")}:${String(now.getMilliseconds()).padStart(3, "0")}`;
}