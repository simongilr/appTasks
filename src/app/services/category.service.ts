import { Injectable } from '@angular/core';
import { db } from '../app.config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { LocalStorageService } from './local-storage.service';

export interface Category {
  id?: string;
  name: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private categoriesCollection = collection(db, "categories");

  constructor(private local: LocalStorageService) {}

  // ======================
  //   GET CATEGORIES
  // ======================
  async getCategories(): Promise<Category[]> {

    // 1. Leer desde localStorage
    const localCats = this.local.get<Category>('categories');
    if (localCats.length > 0) {
      return localCats;
    }

    // 2. Si está vacío, cargar de Firebase
    const snapshot = await getDocs(this.categoriesCollection);

    const categories = snapshot.docs.map(d =>
      ({ id: d.id, ...d.data() } as Category)
    );

    // 3. Guardar en localStorage para cacheo
    this.local.set('categories', categories);

    return categories;
  }

  // ======================
  //   ADD CATEGORY
  // ======================
  async addCategory(name: string) {

    const docRef = await addDoc(this.categoriesCollection, {
      name,
      createdAt: serverTimestamp()
    });

    // Actualizar localStorage inmediatamente
    const localCats = this.local.get<Category>('categories');
    localCats.unshift({ id: docRef.id, name });
    this.local.set('categories', localCats);

    return docRef;
  }

  // ======================
  //   UPDATE CATEGORY
  // ======================
  async updateCategory(id: string, name: string) {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, { name });

    // Sincronizar localStorage
    const localCats = this.local.get<Category>('categories');
    const index = localCats.findIndex(c => c.id === id);
    if (index !== -1) {
      localCats[index].name = name;
      this.local.set('categories', localCats);
    }
  }

  // ======================
  //   DELETE CATEGORY
  // ======================
  async deleteCategory(id: string) {
    const docRef = doc(db, "categories", id);
    await deleteDoc(docRef);

    // Sincronizar localStorage
    const localCats = this.local.get<Category>('categories');

    const filtered = localCats.filter(c => c.id !== id);

    this.local.set('categories', filtered);
  }
}
