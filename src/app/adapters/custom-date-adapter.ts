import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { format, parse, isValid } from 'date-fns';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    if (!isValid(date)) {
      return '';
    }
    
    // Formato DD/MM/YYYY
    return format(date, 'dd/MM/yyyy');
  }

  override parse(value: string): Date | null {
    if (!value) {
      return null;
    }

    // Intentar parsear formato DD/MM/YYYY
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Los meses en Date son 0-indexed
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      if (isValid(date) && 
          date.getDate() === day && 
          date.getMonth() === month && 
          date.getFullYear() === year) {
        return date;
      }
    }

    // Fallback: intentar parsear con date-fns
    try {
      const parsed = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Ignorar error
    }

    // Fallback: usar el parseador nativo
    return super.parse(value);
  }

  override getFirstDayOfWeek(): number {
    // Lunes como primer día de la semana (0 = Domingo, 1 = Lunes)
    return 1;
  }
}






