'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, Project, Phase, Task, TimeEntry } from '../types';

interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  isLoading: boolean;
  isSessionChecked: boolean;
}

type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_PHASES'; payload: Phase[] }
  | { type: 'ADD_PHASE'; payload: Phase }
  | { type: 'UPDATE_PHASE'; payload: Phase }
  | { type: 'DELETE_PHASE'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TIME_ENTRIES'; payload: TimeEntry[] }
  | { type: 'ADD_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'UPDATE_TIME_ENTRY'; payload: TimeEntry }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_CHECKED'; payload: boolean };

const initialState: AppState = {
  currentUser: null,
  users: [],
  projects: [],
  phases: [],
  tasks: [],
  timeEntries: [],
  isLoading: true,
  isSessionChecked: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };
    case 'SET_PHASES':
      return { ...state, phases: action.payload };
    case 'ADD_PHASE':
      return { ...state, phases: [...state.phases, action.payload] };
    case 'UPDATE_PHASE':
      return {
        ...state,
        phases: state.phases.map(phase =>
          phase.id === action.payload.id ? action.payload : phase
        ),
      };
    case 'DELETE_PHASE':
      return {
        ...state,
        phases: state.phases.filter(phase => phase.id !== action.payload),
      };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'SET_TIME_ENTRIES':
      return { ...state, timeEntries: action.payload };
    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [...state.timeEntries, action.payload] };
    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.filter(entry => entry.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SESSION_CHECKED':
      return { ...state, isSessionChecked: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 既にログイン済みの場合はセッション確認をスキップ
        const storedUser = localStorage.getItem('manhour-current-user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const userWithDates = {
              ...parsedUser,
              createdAt: new Date(parsedUser.createdAt),
              updatedAt: new Date(parsedUser.updatedAt),
            };
            dispatch({ type: 'SET_CURRENT_USER', payload: userWithDates });
            console.log('ローカルストレージから復元されたユーザー:', userWithDates);
          } catch (parseError) {
            console.error('ローカルストレージのユーザー情報解析エラー:', parseError);
            localStorage.removeItem('manhour-current-user');
          }
        } else {
          // ローカルストレージにユーザー情報がない場合のみセッション確認
          try {
            const sessionResponse = await fetch('/api/auth/session');
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              if (sessionData.success && sessionData.data) {
                const currentUser = {
                  ...sessionData.data,
                  createdAt: new Date(sessionData.data.createdAt),
                  updatedAt: new Date(sessionData.data.updatedAt),
                };
                dispatch({ type: 'SET_CURRENT_USER', payload: currentUser });
                console.log('セッションから復元されたユーザー:', currentUser);
              }
            } else {
              dispatch({ type: 'SET_CURRENT_USER', payload: null });
            }
          } catch (sessionError) {
            console.log('セッション確認エラー:', sessionError);
            dispatch({ type: 'SET_CURRENT_USER', payload: null });
          }
        }
        
        // セッションチェック完了をマーク
        dispatch({ type: 'SET_SESSION_CHECKED', payload: true });

        // APIからユーザーデータを取得
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const usersWithPassword = users.map((user: any) => ({
            ...user,
            password: '', // セキュリティのため、パスワードは空にする
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          }));
          dispatch({ type: 'SET_USERS', payload: usersWithPassword });
        }

        // APIからプロジェクトデータを取得
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json();
          const projectsWithDates = projects.map((project: any) => ({
            ...project,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          }));
          dispatch({ type: 'SET_PROJECTS', payload: projectsWithDates });

          // プロジェクトから工程とタスクを抽出
          const allPhases: Phase[] = [];
          const allTasks: Task[] = [];
          
          projects.forEach((project: any) => {
            if (project.phases) {
              project.phases.forEach((phase: any) => {
                allPhases.push({
                  ...phase,
                  createdAt: new Date(phase.createdAt),
                  updatedAt: new Date(phase.updatedAt),
                });
                
                if (phase.tasks) {
                  phase.tasks.forEach((task: any) => {
                    allTasks.push({
                      ...task,
                      createdAt: new Date(task.createdAt),
                      updatedAt: new Date(task.updatedAt),
                    });
                  });
                }
              });
            }
          });
          
          dispatch({ type: 'SET_PHASES', payload: allPhases });
          dispatch({ type: 'SET_TASKS', payload: allTasks });
        }

        // APIから時間入力データを取得
        const timeEntriesResponse = await fetch('/api/time-entries');
        if (timeEntriesResponse.ok) {
          const timeEntries = await timeEntriesResponse.json();
          const timeEntriesWithDates = timeEntries.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));
          dispatch({ type: 'SET_TIME_ENTRIES', payload: timeEntriesWithDates });
        }
      } catch (error) {
        console.error('Failed to load data from API:', error);
        // エラーが発生してもセッションチェック完了をマーク
        dispatch({ type: 'SET_SESSION_CHECKED', payload: true });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // localStorageへの保存は削除（データベースを使用するため）

  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('manhour-current-user', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('manhour-current-user');
    }
  }, [state.currentUser]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
