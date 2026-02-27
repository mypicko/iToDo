use chrono::Utc;
use directories::ProjectDirs;
use log::info;
use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

// ============== Models ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub is_completed: bool,
    pub is_important: bool,
    pub due_date: Option<String>,
    pub start_date: Option<String>,
    pub remind_time: Option<String>,
    pub repeat_rule: Option<String>,
    pub list_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct List {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub is_default: bool,
    pub created_at: String,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskInput {
    pub title: String,
    pub content: Option<String>,
    pub list_id: String,
    pub due_date: Option<String>,
    pub start_date: Option<String>,
    pub remind_time: Option<String>,
    pub repeat_rule: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_completed: Option<bool>,
    pub is_important: Option<bool>,
    pub due_date: Option<String>,
    pub start_date: Option<String>,
    pub remind_time: Option<String>,
    pub repeat_rule: Option<String>,
    pub list_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateListInput {
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateListInput {
    pub id: String,
    pub name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub order: Option<i32>,
}

// ============== Database ==============

pub struct DbConnection(pub Mutex<Connection>);

fn get_data_dir() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "itodo", "iToDo") {
        let data_dir = proj_dirs.data_dir().to_path_buf();
        fs::create_dir_all(&data_dir).ok();
        data_dir
    } else {
        PathBuf::from(".")
    }
}

fn get_log_dir() -> PathBuf {
    get_data_dir().join("logs")
}

#[derive(Serialize)]
pub struct AboutInfo {
    pub app_name: String,
    pub version: String,
    pub developer: String,
    pub developer_email: Option<String>,
    pub changelog: String,
}

#[tauri::command]
fn get_log_path() -> String {
    get_log_dir().to_string_lossy().to_string()
}

#[tauri::command]
fn get_about_info() -> AboutInfo {
    AboutInfo {
        app_name: "iToDo".to_string(),
        version: "1.0.0".to_string(),
        developer: "iToDo".to_string(),
        developer_email: None,
        changelog: "Initial release\n- Task management\n- List organization\n- Import/Export".to_string(),
    }
}

fn init_database(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            icon TEXT,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            is_completed INTEGER NOT NULL DEFAULT 0,
            is_important INTEGER NOT NULL DEFAULT 0,
            due_date TEXT,
            start_date TEXT,
            remind_time TEXT,
            repeat_rule TEXT,
            list_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Create default list if not exists
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM lists WHERE is_default = 1", [], |row| row.get(0))?;
    if count == 0 {
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO lists (id, name, color, icon, is_default, created_at, order_index) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![Uuid::new_v4().to_string(), "我的一天", Some("#0078D4".to_string()), Some("sun".to_string()), 1, now, 0],
        )?;
    }

    Ok(())
}

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        is_completed: row.get::<_, i32>(3)? == 1,
        is_important: row.get::<_, i32>(4)? == 1,
        due_date: row.get(5)?,
        start_date: row.get(6)?,
        remind_time: row.get(7)?,
        repeat_rule: row.get(8)?,
        list_id: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

fn row_to_list(row: &rusqlite::Row) -> rusqlite::Result<List> {
    Ok(List {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
        icon: row.get(3)?,
        is_default: row.get::<_, i32>(4)? == 1,
        created_at: row.get(5)?,
        order: row.get(6)?,
    })
}

// ============== Tauri Commands - Lists ==============

#[tauri::command]
fn get_lists(db: State<DbConnection>) -> Result<Vec<List>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, color, icon, is_default, created_at, order_index FROM lists ORDER BY order_index ASC")
        .map_err(|e| e.to_string())?;

    let lists = stmt
        .query_map([], row_to_list)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(lists)
}

#[tauri::command]
fn create_list(input: CreateListInput, db: State<DbConnection>) -> Result<List, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let created_at = now.clone();
    let order: i32 = conn
        .query_row("SELECT COALESCE(MAX(order_index), 0) FROM lists", [], |row| row.get(0))
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO lists (id, name, color, icon, is_default, created_at, order_index) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, input.name, input.color, input.icon, 0, now, order + 1],
    ).map_err(|e| e.to_string())?;

    Ok(List {
        id,
        name: input.name,
        color: input.color,
        icon: input.icon,
        is_default: false,
        created_at,
        order: order + 1,
    })
}

#[tauri::command]
fn update_list(input: UpdateListInput, db: State<DbConnection>) -> Result<List, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, color, icon, is_default, created_at, order_index FROM lists WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut list = stmt
        .query_row([&input.id], row_to_list)
        .map_err(|e| e.to_string())?;

    if let Some(name) = input.name {
        list.name = name;
    }
    if let Some(color) = input.color {
        list.color = Some(color);
    }
    if let Some(icon) = input.icon {
        list.icon = Some(icon);
    }
    if let Some(order) = input.order {
        list.order = order;
    }

    conn.execute(
        "UPDATE lists SET name = ?1, color = ?2, icon = ?3, order_index = ?4 WHERE id = ?5",
        params![list.name, list.color, list.icon, list.order, list.id],
    ).map_err(|e| e.to_string())?;

    Ok(list)
}

#[tauri::command]
fn delete_list(id: String, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let is_default: i32 = conn
        .query_row("SELECT is_default FROM lists WHERE id = ?1", [&id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if is_default == 1 {
        return Err("Cannot delete default list".to_string());
    }

    conn.execute("DELETE FROM tasks WHERE list_id = ?1", [&id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM lists WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;

    Ok(())
}

// ============== Tauri Commands - Tasks ==============

#[tauri::command]
fn get_tasks(list_id: Option<String>, db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tasks = match list_id {
        Some(lid) => {
            let mut stmt = conn
                .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE list_id = ?1 ORDER BY is_completed ASC, created_at DESC")
                .map_err(|e| e.to_string())?;
            let result = stmt.query_map([&lid], row_to_task)
                .map_err(|e| e.to_string())?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?;
            result
        }
        None => {
            let mut stmt = conn
                .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks ORDER BY is_completed ASC, created_at DESC")
                .map_err(|e| e.to_string())?;
            let result = stmt.query_map([], row_to_task)
                .map_err(|e| e.to_string())?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())?;
            result
        }
    };

    Ok(tasks)
}

#[tauri::command]
fn get_important_tasks(db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE is_important = 1 ORDER BY is_completed ASC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn get_today_tasks(db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE date(due_date) = date(?1) ORDER BY is_completed ASC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([&today], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn get_planned_tasks(db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE date(due_date) > date(?1) OR date(start_date) > date(?1) ORDER BY due_date ASC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([&today], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn get_completed_tasks(db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE is_completed = 1 ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn search_tasks(query: String, db: State<DbConnection>) -> Result<Vec<Task>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE title LIKE ?1 OR content LIKE ?1 ORDER BY is_completed ASC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([&search_pattern], row_to_task)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

#[tauri::command]
fn create_task(input: CreateTaskInput, db: State<DbConnection>) -> Result<Task, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let created_at = now.clone();
    let updated_at = now.clone();

    conn.execute(
        "INSERT INTO tasks (id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            id,
            input.title,
            input.content,
            0,
            0,
            input.due_date,
            input.start_date,
            input.remind_time,
            input.repeat_rule,
            input.list_id,
            created_at,
            updated_at
        ],
    ).map_err(|e| e.to_string())?;

    Ok(Task {
        id,
        title: input.title,
        content: input.content,
        is_completed: false,
        is_important: false,
        due_date: input.due_date,
        start_date: input.start_date,
        remind_time: input.remind_time,
        repeat_rule: input.repeat_rule,
        list_id: input.list_id,
        created_at,
        updated_at,
    })
}

#[tauri::command]
fn update_task(input: UpdateTaskInput, db: State<DbConnection>) -> Result<Task, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut task = stmt
        .query_row([&input.id], row_to_task)
        .map_err(|e| e.to_string())?;

    if let Some(title) = input.title {
        task.title = title;
    }
    if let Some(content) = input.content {
        task.content = Some(content);
    }
    if let Some(is_completed) = input.is_completed {
        task.is_completed = is_completed;
    }
    if let Some(is_important) = input.is_important {
        task.is_important = is_important;
    }
    if input.due_date.is_some() {
        task.due_date = input.due_date;
    }
    if input.start_date.is_some() {
        task.start_date = input.start_date;
    }
    if input.remind_time.is_some() {
        task.remind_time = input.remind_time;
    }
    if input.repeat_rule.is_some() {
        task.repeat_rule = input.repeat_rule;
    }
    if let Some(list_id) = input.list_id {
        task.list_id = list_id;
    }
    task.updated_at = now;

    conn.execute(
        "UPDATE tasks SET title = ?1, content = ?2, is_completed = ?3, is_important = ?4, due_date = ?5, start_date = ?6, remind_time = ?7, repeat_rule = ?8, list_id = ?9, updated_at = ?10 WHERE id = ?11",
        params![
            task.title,
            task.content,
            task.is_completed as i32,
            task.is_important as i32,
            task.due_date,
            task.start_date,
            task.remind_time,
            task.repeat_rule,
            task.list_id,
            task.updated_at,
            task.id
        ],
    ).map_err(|e| e.to_string())?;

    Ok(task)
}

#[tauri::command]
fn delete_task(id: String, db: State<DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn toggle_task_important(id: String, db: State<DbConnection>) -> Result<Task, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET is_important = NOT is_important, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    stmt.query_row([&id], row_to_task)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_task_completed(id: String, db: State<DbConnection>) -> Result<Task, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE tasks SET is_completed = NOT is_completed, updated_at = ?1 WHERE id = ?2",
        params![now, id],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    stmt.query_row([&id], row_to_task)
        .map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub version: String,
    pub export_date: String,
    pub tasks: Vec<Task>,
    pub lists: Vec<List>,
}

#[tauri::command]
async fn export_tasks_to_file(list_id: Option<String>, db: State<'_, DbConnection>) -> Result<bool, String> {
    let (tasks, lists) = {
        let conn = db.0.lock().map_err(|e| e.to_string())?;

        let tasks = match list_id {
            Some(lid) => {
                let mut stmt = conn
                    .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE list_id = ?1 ORDER BY is_completed ASC, created_at DESC")
                    .map_err(|e| e.to_string())?;
                let result = stmt.query_map([&lid], row_to_task)
                    .map_err(|e| e.to_string())?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| e.to_string())?;
                result
            }
            None => {
                let mut stmt = conn
                    .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks ORDER BY is_completed ASC, created_at DESC")
                    .map_err(|e| e.to_string())?;
                let result = stmt.query_map([], row_to_task)
                    .map_err(|e| e.to_string())?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| e.to_string())?;
                result
            }
        };

        let mut stmt = conn
            .prepare("SELECT id, name, color, icon, is_default, created_at, order_index FROM lists")
            .map_err(|e| e.to_string())?;
        let lists = stmt.query_map([], |row| {
            Ok(List {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                is_default: row.get(4)?,
                created_at: row.get(5)?,
                order: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

        (tasks, lists)
    };

    let export_data = ExportData {
        version: "1.0".to_string(),
        export_date: Utc::now().to_rfc3339(),
        tasks,
        lists,
    };

    let json_data = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;

    let data_dir = get_data_dir();
    let file_name = format!("itodo-export-{}.json", chrono::Local::now().format("%Y-%m-%d_%H%M%S"));
    let file_path = data_dir.join(&file_name);

    fs::write(&file_path, json_data).map_err(|e| format!("Failed to write file: {}", e))?;
    info!("Exported tasks to {:?}", file_path);
    Ok(true)
}

#[tauri::command]
async fn import_tasks(json_data: String, db: State<'_, DbConnection>) -> Result<Vec<Task>, String> {
    let export_data: ExportData = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to parse import data: {}", e))?;

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut imported_tasks = Vec::new();

    for list in &export_data.lists {
        let mut stmt = conn
            .prepare("SELECT id FROM lists WHERE id = ?1")
            .map_err(|e| e.to_string())?;
        let exists: Result<String, _> = stmt.query_row([&list.id], |row| row.get(0));

        if exists.is_err() {
            conn.execute(
                "INSERT INTO lists (id, name, color, icon, is_default, created_at, order_index) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                (&list.id, &list.name, &list.color, &list.icon, &list.is_default, &list.created_at, &list.order),
            ).map_err(|e| e.to_string())?;
        }
    }

    for task in &export_data.tasks {
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO tasks (id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            (
                &new_id,
                &task.title,
                &task.content,
                &task.is_completed,
                &task.is_important,
                &task.due_date,
                &task.start_date,
                &task.remind_time,
                &task.repeat_rule,
                &task.list_id,
                &now,
                &now,
            ),
        ).map_err(|e| e.to_string())?;

        imported_tasks.push(Task {
            id: new_id,
            title: task.title.clone(),
            content: task.content.clone(),
            is_completed: task.is_completed,
            is_important: task.is_important,
            due_date: task.due_date.clone(),
            start_date: task.start_date.clone(),
            remind_time: task.remind_time.clone(),
            repeat_rule: task.repeat_rule.clone(),
            list_id: task.list_id.clone(),
            created_at: now.clone(),
            updated_at: now.clone(),
        });
    }

    info!("Imported {} tasks", imported_tasks.len());
    Ok(imported_tasks)
}

#[tauri::command]
async fn export_tasks_to_path(file_path: String, list_id: Option<String>, db: State<'_, DbConnection>) -> Result<bool, String> {
    let (tasks, lists) = {
        let conn = db.0.lock().map_err(|e| e.to_string())?;

        let tasks = match list_id {
            Some(lid) => {
                let mut stmt = conn
                    .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks WHERE list_id = ?1 ORDER BY is_completed ASC, created_at DESC")
                    .map_err(|e| e.to_string())?;
                let result = stmt.query_map([&lid], row_to_task)
                    .map_err(|e| e.to_string())?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| e.to_string())?;
                result
            }
            None => {
                let mut stmt = conn
                    .prepare("SELECT id, title, content, is_completed, is_important, due_date, start_date, remind_time, repeat_rule, list_id, created_at, updated_at FROM tasks ORDER BY is_completed ASC, created_at DESC")
                    .map_err(|e| e.to_string())?;
                let result = stmt.query_map([], row_to_task)
                    .map_err(|e| e.to_string())?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| e.to_string())?;
                result
            }
        };

        let mut stmt = conn
            .prepare("SELECT id, name, color, icon, is_default, created_at, order_index FROM lists")
            .map_err(|e| e.to_string())?;
        let lists = stmt.query_map([], |row| {
            Ok(List {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                is_default: row.get(4)?,
                created_at: row.get(5)?,
                order: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

        (tasks, lists)
    };

    let export_data = ExportData {
        version: "1.0".to_string(),
        export_date: Utc::now().to_rfc3339(),
        tasks,
        lists,
    };

    let json_data = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;

    fs::write(&file_path, json_data).map_err(|e| format!("Failed to write file: {}", e))?;
    info!("Exported tasks to {:?}", file_path);
    Ok(true)
}

// ============== App Setup ==============

pub fn run() {
    let _ = env_logger::try_init();
    info!("Starting iToDo application");

    let data_dir = get_data_dir();
    let db_path = data_dir.join("itodo.db");
    info!("Database path: {:?}", db_path);

    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_database(&conn).expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(DbConnection(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            get_lists,
            create_list,
            update_list,
            delete_list,
            get_tasks,
            get_important_tasks,
            get_today_tasks,
            get_planned_tasks,
            get_completed_tasks,
            search_tasks,
            create_task,
            update_task,
            delete_task,
            toggle_task_important,
            toggle_task_completed,
            export_tasks_to_file,
            import_tasks,
            export_tasks_to_path,
            get_log_path,
            get_about_info,
        ])
        .setup(|_app| {
            info!("App setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
