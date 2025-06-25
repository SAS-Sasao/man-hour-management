'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { User, Project, Phase, Task, TimeEntry } from '../types';
import { createDefaultPhasesAndTasks } from '../utils/defaultData';

interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  timeEntries: TimeEntry[];
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
  | { type: 'DELETE_TIME_ENTRY'; payload: string };

const initialState: AppState = {
  currentUser: null,
  users: [],
  projects: [],
  phases: [],
  tasks: [],
  timeEntries: [],
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
        const savedUsers = localStorage.getItem('manhour-users');
        if (savedUsers) {
          const users = await Promise.all(
            JSON.parse(savedUsers).map(async (user: any) => {
              // 既存ユーザーにパスワードフィールドがない場合、デフォルトパスワードを設定
              let password = user.password;
              if (!password) {
                password = await bcrypt.hash('demo123', 10);
              }
              
              return {
                ...user,
                password,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              };
            })
          );
          dispatch({ type: 'SET_USERS', payload: users });
        } else {
          // 笹尾 豊樹のアカウントを作成
          const createSasaoUser = async () => {
            const sasaoPassword = await bcrypt.hash('ts05140952', 10);
            const sasaoUser: User = {
              id: 'sasao-1',
              name: '笹尾 豊樹',
              email: 'sasao@sas-com.com',
              password: sasaoPassword,
              role: 'admin',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            dispatch({ type: 'SET_USERS', payload: [sasaoUser] });
          };
          createSasaoUser();
        }

        const savedProjects = localStorage.getItem('manhour-projects');
        if (savedProjects) {
          const projects = JSON.parse(savedProjects).map((project: any) => ({
            ...project,
            startDate: new Date(project.startDate),
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          }));
          dispatch({ type: 'SET_PROJECTS', payload: projects });
        } else {
          // デフォルトプロジェクトを作成
          const defaultProject: Project = {
            id: 'project-1',
            name: 'サンプルプロジェクト',
            description: '工数管理システムのデモ用プロジェクトです',
            startDate: new Date(),
            status: 'active',
            managerId: 'sasao-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dispatch({ type: 'SET_PROJECTS', payload: [defaultProject] });
          
          // デフォルトの工程とタスクを作成
          const { phases, tasks } = createDefaultPhasesAndTasks('project-1');
          dispatch({ type: 'SET_PHASES', payload: phases });
          dispatch({ type: 'SET_TASKS', payload: tasks });
        }

        const savedPhases = localStorage.getItem('manhour-phases');
        if (savedPhases) {
          const phases = JSON.parse(savedPhases).map((phase: any) => ({
            ...phase,
            createdAt: new Date(phase.createdAt),
            updatedAt: new Date(phase.updatedAt),
          }));
          dispatch({ type: 'SET_PHASES', payload: phases });
        }

        const savedTasks = localStorage.getItem('manhour-tasks');
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks).map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
          }));
          dispatch({ type: 'SET_TASKS', payload: tasks });
        }

        const savedTimeEntries = localStorage.getItem('manhour-timeentries');
        if (savedTimeEntries) {
          const timeEntries = JSON.parse(savedTimeEntries).map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));
          dispatch({ type: 'SET_TIME_ENTRIES', payload: timeEntries });
        }

        const savedCurrentUser = localStorage.getItem('manhour-current-user');
        if (savedCurrentUser) {
          const currentUser = JSON.parse(savedCurrentUser);
          dispatch({ type: 'SET_CURRENT_USER', payload: {
            ...currentUser,
            createdAt: new Date(currentUser.createdAt),
            updatedAt: new Date(currentUser.updatedAt),
          }});
        }
      } catch (error) {
        console.error('Failed to load data from localStorage:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('manhour-users', JSON.stringify(state.users));
  }, [state.users]);

  useEffect(() => {
    localStorage.setItem('manhour-projects', JSON.stringify(state.projects));
  }, [state.projects]);

  useEffect(() => {
    localStorage.setItem('manhour-phases', JSON.stringify(state.phases));
  }, [state.phases]);

  useEffect(() => {
    localStorage.setItem('manhour-tasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  useEffect(() => {
    localStorage.setItem('manhour-timeentries', JSON.stringify(state.timeEntries));
  }, [state.timeEntries]);

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