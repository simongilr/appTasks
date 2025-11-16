import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // 👈 ESTE método debe aceptar genéricos
  get<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : [];
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }
}
