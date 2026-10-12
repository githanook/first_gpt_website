import { useState } from 'react'
import './App.css'

const STORAGE_KEY = 'haru-todos-v1'
const FILTER_LABELS = { all: '전체', active: '진행 중', completed: '완료' }

// 저장된 데이터의 형태와 ID 중복을 확인합니다.
function isValidTodoList(todos) {
  if (!Array.isArray(todos)) return false

  const hasValidItems = todos.every(todo => (
    todo &&
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    typeof todo.completed === 'boolean'
  ))
  const hasUniqueIds = new Set(todos.map(todo => todo?.id)).size === todos.length

  return hasValidItems && hasUniqueIds
}

// 첫 렌더링에서만 저장된 목록을 읽습니다.
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { todos: [], error: '' }

    const todos = JSON.parse(raw)
    if (!isValidTodoList(todos)) throw new Error('Invalid data')

    return { todos, error: '' }
  } catch {
    return {
      todos: [],
      error: '저장된 목록을 불러오지 못했어요. 목록을 변경하면 다시 저장을 시도합니다.',
    }
  }
}

function getEmptyState(filter, totalCount) {
  if (filter === 'completed') {
    return {
      title: '완료한 일이 여기에 모여요',
      description: '할 일을 마치면 체크 표시를 눌러주세요.',
    }
  }

  if (filter === 'active' && totalCount > 0) {
    return {
      title: '할 일을 모두 완료했어요!',
      description: '차근차근 해낸 오늘, 수고했어요.',
    }
  }

  return {
    title: '새로운 시작을 기다리고 있어요',
    description: '작은 일도 좋아요. 첫 할 일을 추가해보세요.',
  }
}

function App() {
  // 상태: 저장된 목록, 입력 내용, 선택한 필터, 오류 안내
  const [initial] = useState(loadTodos)
  const [todos, setTodos] = useState(initial.todos)
  const [storageError, setStorageError] = useState(initial.error)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')
  const [inputError, setInputError] = useState('')

  // 현재 목록에서 계산하는 값
  const totalCount = todos.length
  const completedCount = todos.filter(todo => todo.completed).length
  const remainingCount = totalCount - completedCount
  const progress = totalCount
    ? Math.round(completedCount / totalCount * 100)
    : 0
  const filterCounts = {
    all: totalCount,
    active: remainingCount,
    completed: completedCount,
  }
  const visibleTodos = todos.filter(todo => {
    if (filter === 'all') return true
    return filter === 'completed' ? todo.completed : !todo.completed
  })
  const emptyState = getEmptyState(filter, totalCount)
  const progressMessage = totalCount
    ? `${totalCount}개의 할 일 중 ${completedCount}개를 완료했어요.`
    : '첫 번째 할 일로 시작해보세요.'

  let remainingMessage = '오늘의 작은 시작을 응원해요'
  if (remainingCount > 0) {
    remainingMessage = `${remainingCount}개의 할 일이 남았어요`
  } else if (totalCount > 0) {
    remainingMessage = '모든 할 일을 마쳤어요'
  }

  // 목록이 변경될 때 화면과 브라우저 저장소를 함께 갱신합니다.
  function updateTodos(nextTodos) {
    setTodos(nextTodos)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos))
      setStorageError('')
    } catch {
      setStorageError('브라우저에 저장하지 못했어요. 새로고침하면 현재 변경 사항이 사라질 수 있어요.')
    }
  }

  function handleTextChange(event) {
    setText(event.target.value)
    setInputError('')
  }

  function handleAddTodo(event) {
    event.preventDefault()
    const trimmedText = text.trim()

    if (!trimmedText) {
      setInputError('할 일 내용을 입력해주세요.')
      return
    }

    const newTodo = {
      id: crypto.randomUUID(),
      text: trimmedText,
      completed: false,
    }

    updateTodos([...todos, newTodo])
    setText('')
    setInputError('')
  }

  function handleToggleTodo(id) {
    const nextTodos = todos.map(todo => (
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
    updateTodos(nextTodos)
  }

  function handleDeleteTodo(id) {
    updateTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <a className="brand" href="./">
          <span className="brand-icon" aria-hidden="true">✓</span>
          하루
          <span className="brand-subtitle">작은 실천, 가벼운 하루</span>
        </a>
        <span className="header-note">나만의 할 일 공간</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <span className="eyebrow">차근차근, 하나씩</span>
          <h1 id="page-title">오늘의 할 일</h1>
          <p>머릿속 할 일을 꺼내놓고, 오늘을 조금 더 가볍게.</p>
        </section>

        <section className="progress-card" aria-label="할 일 진행 상황">
          <div className="progress-heading">
            <span>작은 완료가 쌓이는 중</span>
            <strong>{progress}<small>%</small></strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="완료율"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>
            {progressMessage}
            <span aria-hidden="true">✦</span>
          </p>
        </section>

        <section className="todo-card" aria-label="할 일 관리">
          {/* 할 일 입력과 오류 안내 */}
          <form className="add-form" onSubmit={handleAddTodo}>
            <label className="sr-only" htmlFor="new-todo">새로운 할 일</label>
            <span className="input-plus" aria-hidden="true">＋</span>
            <input
              id="new-todo"
              value={text}
              onChange={handleTextChange}
              placeholder="어떤 일을 해볼까요?"
              maxLength={300}
              autoComplete="off"
              aria-invalid={Boolean(inputError)}
              aria-describedby={inputError ? 'input-error' : undefined}
            />
            <button className="add-button" type="submit">
              추가<span aria-hidden="true"> ↗</span>
            </button>
          </form>

          {inputError && (
            <p id="input-error" className="error-message" role="alert">
              {inputError}
            </p>
          )}
          {storageError && (
            <p className="error-message" role="alert">{storageError}</p>
          )}

          {/* 필터와 목록 */}
          <div className="list-toolbar">
            <div className="filters" role="group" aria-label="할 일 필터">
              {Object.entries(FILTER_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={filter === key ? 'selected' : ''}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}<span>{filterCounts[key]}</span>
                </button>
              ))}
            </div>
            <span className="list-caption">나의 체크리스트</span>
          </div>

          {visibleTodos.length > 0 ? (
            <ul className="todo-list">
              {visibleTodos.map(todo => (
                <li
                  key={todo.id}
                  className={todo.completed ? 'todo-item completed' : 'todo-item'}
                >
                  <label className="todo-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <span>{todo.text}</span>
                  </label>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`${todo.text} 삭제`}
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">✓</div>
              <h2>{emptyState.title}</h2>
              <p>{emptyState.description}</p>
            </div>
          )}

          <div className="list-footer" role="status">
            {remainingMessage}
            <span>하나씩, 내 속도대로</span>
          </div>
        </section>

        <footer className="page-footer">
          <span aria-hidden="true">◈</span>
          {storageError
            ? '저장 상태를 확인해주세요'
            : '할 일은 이 브라우저에 자동으로 저장돼요'}
        </footer>
      </main>
    </div>
  )
}

export default App
