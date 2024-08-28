import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';  // スタイルシートを追加

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [commentInputs, setCommentInputs] = useState({}); // 各タスクのコメント入力を管理する状態

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      const tasksWithComments = response.data.map(task => ({
        ...task,
        comments: Array.isArray(task.comments) ? task.comments : []  // commentsが配列でなければ空の配列をセット
      }));
      setTasks(tasksWithComments);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
    }
  };

  const addTask = async () => {
    try {
      const response = await axios.post('/api/tasks/create', newTask);
      setTasks([...tasks, { ...response.data, comments: [] }]);
      setNewTask({ title: '', description: '' });
      setError('');
    } catch (err) {
      setError('Failed to add task: ' + err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.post(`/api/tasks/delete/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
      setError('');
    } catch (err) {
      setError('Failed to delete task: ' + err.message);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const taskToComplete = tasks.find(task => task.id === taskId);
      const updatedTask = { ...taskToComplete, completed: true };
      await axios.post(`/api/tasks/update/${taskId}`, updatedTask);
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      setError('');
    } catch (err) {
      setError('Failed to complete task: ' + err.message);
    }
  };

  const handleCommentInputChange = (taskId, value) => {
    setCommentInputs({
      ...commentInputs,
      [taskId]: value,
    });
  };

  const addComment = async (taskId) => {
    const newComment = commentInputs[taskId]?.trim(); // 空白をトリムして取得
    if (!newComment) {
      // コメントが空の場合はリクエストを送信しない
      setError('Comment cannot be empty');
      return;
    }
    
    const currentTimestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo', hour12: false }).replace(' ', 'T'); // 現在の日本標準時をISO形式で取得
    
    try {
      const response = await axios.post(`/api/tasks/${taskId}/comments/add`, { 
        content: newComment, 
        createdAt: currentTimestamp  // 現在のシステム日時をリクエストに含める
      });
      
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          comments: Array.isArray(task.comments) 
            ? [...task.comments, response.data] 
            : [response.data] 
        } : task
      );
      setTasks(updatedTasks);
      setCommentInputs({ ...commentInputs, [taskId]: '' }); // コメント入力フィールドをクリア
      setError('');
    } catch (err) {
      setError('Failed to add comment: ' + err.message);
    }
  };

  // yyyy/mm/dd hh:mm形式に変換する関数（日本のローカル時間でフォーマット）
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0始まりのため+1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="App">
      <div className="wrapper">
        <h1>ToDo List</h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="task-input">
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="input-field"
        />
        <button onClick={addTask} className="add-task-btn">Add Task</button>
      </div>
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.completed ? 'task completed' : 'task'}>
            <div className="task-content">
              <h2>{task.title}</h2>
              <p>{task.description}</p>
            </div>
            <div className="task-buttons">
              <button onClick={() => completeTask(task.id)} className="complete-btn">Complete</button>
              <button 
                onClick={() => deleteTask(task.id)} 
                className="delete-btn"
              >
                Delete
              </button>
            </div>
            <ul className="comment-list">
              {Array.isArray(task.comments) && task.comments.map((comment) => (
                <li key={comment.id} className="comment">
                  <span className="comment-content">{comment.content}</span>
                  <small className="comment-timestamp">{formatTimestamp(comment.createdAt)}</small> {/* createdAtをフォーマットして表示 */}
                </li>
              ))}
            </ul>
            <div className="comment-input">
              <input
                type="text"
                placeholder="Add Comment"
                value={commentInputs[task.id] || ''} // 各タスク固有のコメント入力
                onChange={(e) => handleCommentInputChange(task.id, e.target.value)}
                disabled={task.completed} // タスクが完了している場合はコメント入力を無効化
              />
              <button onClick={() => addComment(task.id)} disabled={task.completed} className="add-comment-btn">
                Add Comment
              </button> {/* タスク完了後はコメント送信を無効化 */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
