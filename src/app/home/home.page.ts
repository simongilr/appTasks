import { Component, OnInit } from '@angular/core';
import { TaskService, Task, Category } from '../services/task.service';
import { CategoryService } from '../services/category.service';  
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {

  tasks: Task[] = [];
  categories: Category[] = [];
  newTask = '';
  selectedCategoryId = '';  
  newTaskCategoryId = '';  
  newCategory = '';
  showNewTaskInput = false;
  loading = true;
  skeletonArray = Array(5); 

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private alertCtrl: AlertController

  ) {}

  async ngOnInit() {
    await this.loadCategories();
    await this.loadTasks();
  }

  async loadCategories() {
    this.categories = await this.categoryService.getCategories();
  }

  async loadTasks(categoryId?: string) {
    this.loading = true;
    this.tasks = await this.taskService.getTasks(categoryId);
    this.loading = false;
  }

  async addTask() {
    if (!this.newTask.trim()) return;
  
    await this.taskService.addTask({
      title: this.newTask,
      completed: false,
      categoryId: this.newTaskCategoryId || null
    });
  
    this.newTask = '';
    this.newTaskCategoryId = '';
    await this.loadTasks();
  }
  

  async deleteTask(task: Task) {
    if (!task.id) return;
    await this.taskService.deleteTask(task.id);
    await this.loadTasks();
  }

  async toggleCompleted(task: Task) {
    if (!task.id) return;
    await this.taskService.updateTask(task.id, { completed: !task.completed });
    await this.loadTasks();
  }

  filterByCategory(categoryId: string) {
    this.loadTasks(categoryId || undefined);
  }

  async editTitle(task: Task, newTitle: string) {
    if (!task.id) return;               
    if (!newTitle.trim()) return;      
    await this.taskService.updateTask(task.id, { title: newTitle });
  
    await this.loadTasks();
  }
  
  getCategoryName(categoryId: string | null | undefined): string {
    if (!categoryId) return 'Sin categoría';
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin categoría';
  }
  
  async createCategory() {
    if (!this.newCategory.trim()) return;
  
    await this.taskService.addCategory(this.newCategory);
  
    this.newCategory = '';
  
    await this.loadCategories(); 
  }
  

  async deleteCategory(cat: Category, event: Event) {
    event.stopPropagation();
  
    const alert = await this.alertCtrl.create({
      header: 'Eliminar categoría',
      message: `¿Seguro que deseas eliminar ${cat.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.categoryService.deleteCategory(cat.id!);
  
            // Actualizar UI
            this.categories = this.categories.filter(c => c.id !== cat.id);
  
            // Quitar categoría de tareas
            this.tasks = this.tasks.map(t => {
              if (t.categoryId === cat.id) {
                t.categoryId = null;
                this.taskService.updateTask(t.id!, { categoryId: null });
              }
              return t;
            });
  
            if (this.selectedCategoryId === cat.id) {
              this.selectedCategoryId = "";
              this.filterByCategory("");
            }
          }
        }
      ]
    });
  
    await alert.present();
  }
  

  async openAddCategoryDialog() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva categoría',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la categoría'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async (data) => {
            const name = data.name?.trim();
  
            if (!name) {
              return false; 
            }
  
            await this.categoryService.addCategory(name);
            await this.loadCategories();
  
            return true; 
          }
        }
      ]
    });
  
    await alert.present();
  }

  async promptNewCategory() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva categoría',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la categoría'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: async (data) => {
            if (data.name && data.name.trim() !== '') {
              await this.categoryService.addCategory(data.name.trim());
              await this.loadCategories();
            }
          }
        }
      ]
    });

    await alert.present();
  }
  

  async openCategoryModal(task: any) {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar categoría',
      inputs: this.categories.map(cat => ({
        name: 'category',
        type: 'radio',
        label: cat.name,
        value: cat.id,
        checked: task.categoryId === cat.id
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Seleccionar',
          handler: (selectedId) => {
            task.categoryId = selectedId;
            this.taskService.updateTaskCategory(task); 
          }
        }
      ]
    });
  
    await alert.present();
  }

  

}
