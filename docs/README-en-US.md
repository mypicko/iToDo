# iToDo User Guide

## Table of Contents
1. [Introduction](#1-introduction)
2. [Quick Start](#2-quick-start)
3. [Task Management](#3-task-management)
4. [List Management](#4-list-management)
5. [Filter Views](#5-filter-views)
6. [Settings](#6-settings)
7. [Import/Export](#7-importexport)
8. [FAQ](#8-faq)

---

## 1. Introduction

iToDo is a task management application inspired by Microsoft ToDo, featuring:

- Create and manage tasks
- Mark tasks as important or completed
- Organize tasks by lists
- Multiple filter views (My Day, Planned, Important, Completed)
- Task import/export
- Multi-language support (Chinese/English)
- Light/Dark theme

---

## 2. Quick Start

### 2.1 Interface Overview

> [Screenshot: Main interface with labeled areas]

The interface consists of:
- **Left Sidebar**: Filter views, list of lists, settings button
- **Top Search Bar**: Search tasks
- **Center Task List**: Tasks for current view
- **Right Detail Panel**: Selected task details

### 2.2 Create Your First Task

1. At the top of the task list, click the **"Add Task"** button
   > [Screenshot: Add task button location]

2. Enter the task title
   > [Screenshot: Enter task title]

3. Press **Enter** or click confirm to create the task
   > [Screenshot: Task created]

---

## 3. Task Management

### 3.1 Mark Task as Important

Click the **star icon** next to the task title to mark it as important.

> [Screenshot: Important star icon]

- Yellow star = Important
- Gray star = Normal

### 3.2 Complete a Task

Click the **checkbox** on the left side of the task to mark it as completed.

> [Screenshot: Before and after completion]

- Incomplete: Empty checkbox
- Completed: Filled checkbox + strikethrough

### 3.3 Edit a Task

1. Click the task title to open the right detail panel
   > [Screenshot: Right detail panel]

2. In the detail panel, you can edit:
   - Task title
   - Task content/notes
   - Due date
   - Start date
   - Reminder time
   - Repeat rule

### 3.4 Delete a Task

**Method 1: Right-click delete**
1. Right-click on the task
2. Click **"Delete"** in the menu
   > [Screenshot: Right-click menu]

**Method 2: Delete from detail panel**
1. Click the task to open detail panel
2. Click **"Delete Task"** button at the bottom
   > [Screenshot: Delete button location]

### 3.5 Add Subtasks

1. Click the task to open detail panel
2. In the **"Subtasks"** section, click **"Add Subtask"**
3. Enter subtask content and press Enter
   > [Screenshot: Subtask list]

---

## 4. List Management

### 4.1 Create a New List

1. In the left sidebar, next to the **"Lists"** title, click the **"+"** button
   > [Screenshot: New list button]

2. Enter the list name
   > [Screenshot: Enter list name]

3. Press Enter to create

### 4.2 Rename a List

> [Screenshot: To be added]

### 4.3 Delete a List

1. Right-click on the list
2. Click **"Delete List"**
   > [Screenshot: Delete list menu]

> **Note**: Deleting a list will not delete tasks in that list. Tasks will be preserved.

---

## 5. Filter Views

The left sidebar provides multiple filter views:

| View | Description | Icon |
|------|-------------|------|
| Tasks | Show all tasks | List icon |
| My Day | Show tasks for today | Sun icon |
| Planned | Show tasks with due dates | Calendar icon |
| Important | Show important tasks | Star icon |
| Completed | Show completed tasks | Check icon |

> [Screenshot: Filter views list]

---

## 6. Settings

Click the **"Settings"** button at the bottom left of the sidebar to open the settings menu.

> [Screenshot: Settings button location]

### 6.1 Language Settings

Supports **Chinese** and **English** languages.

1. Click Settings → Hover over **"Language"**
2. Select the desired language
   > [Screenshot: Language selection]

### 6.2 Theme Settings

Supports **Light**, **Dark**, and **System** themes.

1. Click Settings → Hover over **"Theme"**
2. Select the desired theme
   > [Screenshot: Theme selection]

### 6.3 Show Log

Click Settings → **"Show Log"** to view the log file location.

> [Screenshot: Log path notification]

### 6.4 About

Click Settings → **"About"** to view app version and changelog.

> [Screenshot: About information]

---

## 7. Import/Export

### 7.1 Export Tasks

1. Click Settings → Hover over **"Export"**
2. Select the list to export (or "All Tasks")
   > [Screenshot: Export menu]

3. Choose the save location in the file dialog
   > [Screenshot: File save dialog]

4. Click Save, tasks will be exported as a JSON file

### 7.2 Import Tasks

1. Click Settings → **"Import"**
   > [Screenshot: Import menu]

2. Choose the JSON file to import in the file dialog
   > [Screenshot: File selection dialog]

3. Click Open, tasks will be imported

> **Note**:
> - Import will automatically create lists that don't exist
> - Imported tasks will get new IDs

---

## 8. FAQ

### Q1: How to backup my tasks?

Use the export feature to export tasks as a JSON file for backup.

### Q2: Where is task data stored?

Task data is stored at:
- macOS: `~/Library/Application Support/com.itodo.iToDo/itodo.db`

### Q3: How to update about information?

Edit the `src-tauri/about.json` file in the app directory, then rebuild the app.

### Q4: How to use reminder?

Set a reminder time in the task detail panel, and the system will send a notification at the specified time.

---

## Changelog

View current version info: Settings → About

---

*Document last updated: 2026-02-27*
