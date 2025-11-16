// src/app/models/task.model.ts
export interface Task {
    id: string;
    title: string;
    completed: boolean;
    categoryId?: string; // referencia a la categoría
    createdAt: number;   // timestamp
  }
  
  // src/app/models/category.model.ts
  export interface Category {
    id: string;
    name: string;
  }
  