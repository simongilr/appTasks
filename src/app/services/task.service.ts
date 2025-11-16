import { Injectable } from '@angular/core';
import { db } from '../app.config';
import { LocalStorageService } from './local-storage.service';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from "firebase/firestore";

// Interfaces
export interface Task {
  id?: string;
  title: string;
  completed: boolean;
  createdAt?: any;
  categoryId?: string | null;
}

export interface Category {
  id?: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private tasksCollection = collection(db, "tasks");
  private categoriesCollection = collection(db, "categories");

  constructor(private local: LocalStorageService) {}

  // ======================================================
  //                    TAREAS
  // ======================================================

  async addTask(task: { title: string; completed: boolean; categoryId?: string | null }) {

    const tempId = "temp-" + Math.random().toString(36).substring(2);

    // 1️⃣ Optimistic UI: agregar local primero
    const localTasks = this.local.get<Task>('tasks');
    localTasks.unshift({
      id: tempId,
      ...task,
      createdAt: new Date()
    });
    this.local.set("tasks", localTasks);

    try {
      // 2️⃣ Guardar en Firestore
      const docRef = await addDoc(this.tasksCollection, {
        ...task,
        createdAt: serverTimestamp()
      });

      // 3️⃣ Reemplazar ID temporal con el real
      const updated = this.local.get<Task>('tasks');
      const index = updated.findIndex(t => t.id === tempId);

      if (index !== -1) {
        updated[index].id = docRef.id;
        this.local.set("tasks", updated);
      }

      return docRef;

    } catch (err) {
      // ❌ Rollback
      const rollback = this.local.get<Task>('tasks').filter(t => t.id !== tempId);
      this.local.set("tasks", rollback);
      throw err;
    }
  }

  async getTasks(categoryId?: string): Promise<Task[]> {

    // 1️⃣ UI instantáneo desde cache
    let localTasks = this.local.get<Task>('tasks');

    // filtrado por categoría
    if (categoryId) {
      localTasks = localTasks.filter(t => t.categoryId === categoryId);
    }

    // 2️⃣ Sincronizar con Firestore
    let q;

    if (categoryId) {
      q = query(
        this.tasksCollection,
        where("categoryId", "==", categoryId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        this.tasksCollection,
        orderBy("createdAt", "desc")
      );
    }

    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }) as Task);

    // actualizar local
    this.local.set("tasks", tasks);

    return tasks;
  }

  async updateTask(id: string, data: Partial<Task>) {

    // 1️⃣ Optimistic UI
    const localTasks = this.local.get<Task>('tasks');
    const idx = localTasks.findIndex(t => t.id === id);

    if (idx !== -1) {
      localTasks[idx] = { ...localTasks[idx], ...data };
      this.local.set("tasks", localTasks);
    }

    try {
      // 2️⃣ Firestore real
      await updateDoc(doc(db, "tasks", id), data);
    } catch (err) {
      console.error("Error actualizando tarea:", err);
    }
  }

  async deleteTask(id: string) {

    // 1️⃣ Optimistic UI
    const previous = this.local.get<Task>('tasks');
    const updated = previous.filter(t => t.id !== id);
    this.local.set("tasks", updated);

    try {
      // 2️⃣ Firestore real
      await deleteDoc(doc(db, "tasks", id));

    } catch (err) {
      // ❌ Rollback
      this.local.set("tasks", previous);
      throw err;
    }
  }

  // ======================================================
  //                    CATEGORÍAS
  // ======================================================

  async addCategory(name: string) {

    const tempId = "temp-" + Math.random().toString(36).substring(2);

    // 1️⃣ UI instantáneo
    const localCats = this.local.get<Category>('categories');
    localCats.unshift({ id: tempId, name });
    this.local.set("categories", localCats);

    try {
      // 2️⃣ Firebase
      const docRef = await addDoc(this.categoriesCollection, { name });

      // 3️⃣ Reemplazar temp ID
      const cats = this.local.get<Category>('categories');
      const idx = cats.findIndex(c => c.id === tempId);
      if (idx !== -1) {
        cats[idx].id = docRef.id;
        this.local.set("categories", cats);
      }

      return docRef;

    } catch (err) {
      // ❌ Rollback
      const rollback = this.local.get<Category>('categories').filter(c => c.id !== tempId);
      this.local.set("categories", rollback);
      throw err;
    }
  }

  async getCategories(): Promise<Category[]> {

    // 1️⃣ UI instantáneo
    const localCats = this.local.get<Category>('categories');

    // 2️⃣ Firestore sync
    const snapshot = await getDocs(this.categoriesCollection);

    const categories = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Category));

    // actualizar cache
    this.local.set("categories", categories);

    return categories;
  }

  async updateCategory(id: string, name: string) {

    // 1️⃣ Optimistic UI
    const localCats = this.local.get<Category>('categories');
    const idx = localCats.findIndex(c => c.id === id);
    if (idx !== -1) {
      localCats[idx].name = name;
      this.local.set("categories", localCats);
    }

    try {
      // 2️⃣ Firestore real
      await updateDoc(doc(db, "categories", id), { name });
    } catch (err) {
      console.error("Error al actualizar categoría:", err);
    }
  }

  async updateTaskCategory(task: any) {
    const taskRef = doc(db, "tasks", task.id);
    await updateDoc(taskRef, { categoryId: task.categoryId });
  
    // Opcional: sincronizar localStorage
    const localTasks = this.local.get<Task>('tasks');
    const index = localTasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      localTasks[index].categoryId = task.categoryId;
      this.local.set('tasks', localTasks);
    }
  }
  

  async deleteCategory(id: string) {

    // 1️⃣ Optimistic UI
    const previous = this.local.get<Category>('categories');
    const updated = previous.filter(c => c.id !== id);
    this.local.set("categories", updated);

    try {
      // 2️⃣ Firestore real
      await deleteDoc(doc(db, "categories", id));

    } catch (err) {
      // ❌ Rollback
      this.local.set("categories", previous);
      throw err;
    }
  }
}
