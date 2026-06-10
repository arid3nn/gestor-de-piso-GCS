import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl || 'http://localhost:3000';
  private initPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  private authHeaders() {
    const token = localStorage.getItem('auth_token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      this.http.get('assets/database.xml', { responseType: 'text' }).subscribe({
        next: (xmlString) => {
          try {
            this.parseAndMergeDatabase(xmlString);
          } catch (e) {
            console.error('Failed to parse database.xml, falling back to empty database:', e);
            this.initializeEmptyDatabase();
          }
          resolve();
        },
        error: (err) => {
          console.warn('Failed to load database.xml, initializing empty database:', err);
          this.initializeEmptyDatabase();
          resolve();
        }
      });
    });
    return this.initPromise;
  }

  private getLocalStorageData(key: string): any {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private setLocalStorageData(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private initializeEmptyDatabase() {
    if (!this.getLocalStorageData('mock_users')) this.setLocalStorageData('mock_users', []);
    if (!this.getLocalStorageData('mock_flats')) this.setLocalStorageData('mock_flats', []);
    if (!this.getLocalStorageData('mock_tasks')) this.setLocalStorageData('mock_tasks', []);
    if (!this.getLocalStorageData('mock_polls')) this.setLocalStorageData('mock_polls', []);
    if (!this.getLocalStorageData('mock_expenses')) this.setLocalStorageData('mock_expenses', []);
    localStorage.setItem('mock_db_initialized', 'true');
  }

  private parseAndMergeDatabase(xmlString: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    const getElementText = (parent: Element, tagName: string, defaultValue = ''): string => {
      const element = parent.getElementsByTagName(tagName)[0];
      return element ? element.textContent || defaultValue : defaultValue;
    };

    // 1. Users
    const localUsers = this.getLocalStorageData('mock_users') || [];
    const xmlUsers = [];
    const userEls = xmlDoc.getElementsByTagName('user');
    for (let i = 0; i < userEls.length; i++) {
      const el = userEls[i];
      xmlUsers.push({
        id: el.getAttribute('id') || `u_${Date.now()}_${i}`,
        firstName: getElementText(el, 'firstName'),
        lastName: getElementText(el, 'lastName'),
        email: getElementText(el, 'email'),
        password: getElementText(el, 'password'),
      });
    }
    xmlUsers.forEach((xu) => {
      if (!localUsers.some((lu: any) => lu.email.toLowerCase() === xu.email.toLowerCase())) {
        localUsers.push(xu);
      }
    });
    this.setLocalStorageData('mock_users', localUsers);

    // 2. Flats
    const localFlats = this.getLocalStorageData('mock_flats') || [];
    const xmlFlats = [];
    const flatEls = xmlDoc.getElementsByTagName('flat');
    for (let i = 0; i < flatEls.length; i++) {
      const el = flatEls[i];
      const members: any[] = [];
      const memberEls = el.getElementsByTagName('member');
      for (let j = 0; j < memberEls.length; j++) {
        const mEl = memberEls[j];
        members.push({
          userId: mEl.getAttribute('userId'),
          role: mEl.getAttribute('role') || 'MEMBER',
        });
      }
      xmlFlats.push({
        id: el.getAttribute('id') || `f_${Date.now()}_${i}`,
        name: getElementText(el, 'name'),
        joinCode: getElementText(el, 'joinCode'),
        members,
      });
    }
    xmlFlats.forEach((xf) => {
      if (!localFlats.some((lf: any) => lf.id === xf.id)) {
        localFlats.push(xf);
      }
    });
    this.setLocalStorageData('mock_flats', localFlats);

    // 3. Tasks
    const localTasks = this.getLocalStorageData('mock_tasks') || [];
    const xmlTasks = [];
    const taskEls = xmlDoc.getElementsByTagName('task');
    for (let i = 0; i < taskEls.length; i++) {
      const el = taskEls[i];
      xmlTasks.push({
        id: el.getAttribute('id') || `t_${Date.now()}_${i}`,
        flatId: el.getAttribute('flatId'),
        title: getElementText(el, 'title'),
        description: getElementText(el, 'description'),
        frequency: getElementText(el, 'frequency'),
        dueDate: getElementText(el, 'dueDate') || null,
        assignedToId: getElementText(el, 'assignedToId') || null,
        completed: getElementText(el, 'completed') === 'true',
      });
    }
    xmlTasks.forEach((xt) => {
      if (!localTasks.some((lt: any) => lt.id === xt.id)) {
        localTasks.push(xt);
      }
    });
    this.setLocalStorageData('mock_tasks', localTasks);

    // 4. Polls
    const localPolls = this.getLocalStorageData('mock_polls') || [];
    const xmlPolls = [];
    const pollEls = xmlDoc.getElementsByTagName('poll');
    for (let i = 0; i < pollEls.length; i++) {
      const el = pollEls[i];
      
      const options: any[] = [];
      const optionEls = el.getElementsByTagName('option');
      for (let j = 0; j < optionEls.length; j++) {
        const optEl = optionEls[j];
        options.push({
          id: optEl.getAttribute('id') || `o_${Date.now()}_${j}`,
          text: optEl.textContent || '',
        });
      }

      const votes: any[] = [];
      const voteEls = el.getElementsByTagName('vote');
      for (let j = 0; j < voteEls.length; j++) {
        const vEl = voteEls[j];
        votes.push({
          userId: vEl.getAttribute('userId'),
          optionId: vEl.getAttribute('optionId'),
        });
      }

      xmlPolls.push({
        id: el.getAttribute('id') || `p_${Date.now()}_${i}`,
        flatId: el.getAttribute('flatId'),
        question: getElementText(el, 'question'),
        expiresAt: getElementText(el, 'expiresAt'),
        options,
        votes,
      });
    }
    xmlPolls.forEach((xp) => {
      if (!localPolls.some((lp: any) => lp.id === xp.id)) {
        localPolls.push(xp);
      }
    });
    this.setLocalStorageData('mock_polls', localPolls);

    // 5. Expenses
    const localExpenses = this.getLocalStorageData('mock_expenses') || [];
    const xmlExpenses = [];
    const expenseEls = xmlDoc.getElementsByTagName('expense');
    for (let i = 0; i < expenseEls.length; i++) {
      const el = expenseEls[i];

      const splits: any[] = [];
      const splitEls = el.getElementsByTagName('split');
      for (let j = 0; j < splitEls.length; j++) {
        const sEl = splitEls[j];
        splits.push({
          userId: sEl.getAttribute('userId'),
          amount: parseFloat(sEl.getAttribute('amount') || '0'),
        });
      }

      xmlExpenses.push({
        id: el.getAttribute('id') || `e_${Date.now()}_${i}`,
        flatId: el.getAttribute('flatId'),
        title: getElementText(el, 'title'),
        amount: parseFloat(getElementText(el, 'amount', '0')),
        category: getElementText(el, 'category'),
        payerId: getElementText(el, 'payerId'),
        splits,
      });
    }
    xmlExpenses.forEach((xe) => {
      if (!localExpenses.some((le: any) => le.id === xe.id)) {
        localExpenses.push(xe);
      }
    });
    this.setLocalStorageData('mock_expenses', localExpenses);

    localStorage.setItem('mock_db_initialized', 'true');
  }

  private getCurrentUser(): any {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  get<T>(path: string): Observable<T> {
    return from(this.init()).pipe(
      switchMap(() => {
        try {
          const response = this.handleMockGet(path);
          return of(response as T);
        } catch (err: any) {
          return throwError(() => ({
            error: { message: err.message || 'Error en petición GET' },
            status: 400,
            statusText: 'Bad Request'
          }));
        }
      })
    );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return from(this.init()).pipe(
      switchMap(() => {
        try {
          const response = this.handleMockPost(path, body);
          return of(response as T);
        } catch (err: any) {
          return throwError(() => ({
            error: { message: err.message || 'Error en petición POST' },
            status: 400,
            statusText: 'Bad Request'
          }));
        }
      })
    );
  }

  private handleMockGet(path: string): any {
    const currentUser = this.getCurrentUser();
    
    // 1. flats
    if (path === 'flats') {
      if (!currentUser) throw new Error('No autorizado');
      const flats = this.getLocalStorageData('mock_flats') || [];
      const users = this.getLocalStorageData('mock_users') || [];
      
      const myFlats = flats.filter((flat: any) =>
        flat.members?.some((m: any) => m.userId === currentUser.id)
      );

      return myFlats.map((flat: any) => {
        const populatedMembers = flat.members.map((member: any) => {
          const user = users.find((u: any) => u.id === member.userId);
          return {
            ...member,
            user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } : null
          };
        });
        return { ...flat, members: populatedMembers };
      });
    }

    // 2. flats/:flatId/tasks
    const tasksMatch = path.match(/^flats\/([^\/]+)\/tasks$/);
    if (tasksMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = tasksMatch[1];
      const tasks = this.getLocalStorageData('mock_tasks') || [];
      const users = this.getLocalStorageData('mock_users') || [];

      const flatTasks = tasks.filter((t: any) => t.flatId === flatId && !t.completed);
      return flatTasks.map((task: any) => {
        const user = users.find((u: any) => u.id === task.assignedToId);
        return {
          ...task,
          assignedTo: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };
      });
    }

    // 3. flats/:flatId/expenses/balances
    const balancesMatch = path.match(/^flats\/([^\/]+)\/expenses\/balances$/);
    if (balancesMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = balancesMatch[1];
      const expenses = this.getLocalStorageData('mock_expenses') || [];
      const users = this.getLocalStorageData('mock_users') || [];

      const flatExpenses = expenses.filter((e: any) => e.flatId === flatId);

      const pairwiseDebts: { [fromUserId: string]: { [toUserId: string]: number } } = {};
      for (const exp of flatExpenses) {
        const payerId = exp.payerId;
        const splits = exp.splits || [];
        for (const split of splits) {
          if (split.userId !== payerId) {
            const fromId = split.userId;
            const toId = payerId;
            if (!pairwiseDebts[fromId]) pairwiseDebts[fromId] = {};
            pairwiseDebts[fromId][toId] = (pairwiseDebts[fromId][toId] || 0) + split.amount;
          }
        }
      }

      const userIds = users.map((u: any) => u.id);
      const finalBalances: any[] = [];
      for (let i = 0; i < userIds.length; i++) {
        const u1 = userIds[i];
        for (let j = i + 1; j < userIds.length; j++) {
          const u2 = userIds[j];
          const u1OwesU2 = (pairwiseDebts[u1] && pairwiseDebts[u1][u2]) || 0;
          const u2OwesU1 = (pairwiseDebts[u2] && pairwiseDebts[u2][u1]) || 0;

          if (u1OwesU2 > u2OwesU1) {
            const net = Number((u1OwesU2 - u2OwesU1).toFixed(2));
            if (net > 0) {
              const fromUser = users.find((u: any) => u.id === u1);
              const toUser = users.find((u: any) => u.id === u2);
              finalBalances.push({
                fromName: fromUser ? `${fromUser.firstName} ${fromUser.lastName || ''}`.trim() : 'Usuario',
                toName: toUser ? `${toUser.firstName} ${toUser.lastName || ''}`.trim() : 'Usuario',
                amount: net
              });
            }
          } else if (u2OwesU1 > u1OwesU2) {
            const net = Number((u2OwesU1 - u1OwesU2).toFixed(2));
            if (net > 0) {
              const fromUser = users.find((u: any) => u.id === u2);
              const toUser = users.find((u: any) => u.id === u1);
              finalBalances.push({
                fromName: fromUser ? `${fromUser.firstName} ${fromUser.lastName || ''}`.trim() : 'Usuario',
                toName: toUser ? `${toUser.firstName} ${toUser.lastName || ''}`.trim() : 'Usuario',
                amount: net
              });
            }
          }
        }
      }
      return finalBalances;
    }

    // 4. flats/:flatId/expenses
    const expensesMatch = path.match(/^flats\/([^\/]+)\/expenses$/);
    if (expensesMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = expensesMatch[1];
      const expenses = this.getLocalStorageData('mock_expenses') || [];
      return expenses.filter((e: any) => e.flatId === flatId);
    }

    // 5. flats/:flatId/polls
    const pollsMatch = path.match(/^flats\/([^\/]+)\/polls$/);
    if (pollsMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = pollsMatch[1];
      const polls = this.getLocalStorageData('mock_polls') || [];

      const flatPolls = polls.filter((p: any) => p.flatId === flatId);
      return flatPolls.map((poll: any) => ({
        id: poll.id,
        question: poll.question,
        expiresAt: poll.expiresAt,
        options: poll.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          _count: {
            votes: (poll.votes || []).filter((v: any) => v.optionId === opt.id).length
          }
        }))
      }));
    }

    // 6. flats/:flatId
    const flatByIdMatch = path.match(/^flats\/([^\/]+)$/);
    if (flatByIdMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = flatByIdMatch[1];
      const flats = this.getLocalStorageData('mock_flats') || [];
      const users = this.getLocalStorageData('mock_users') || [];
      const flat = flats.find((f: any) => f.id === flatId);
      if (!flat) throw new Error('Piso no encontrado');

      const populatedMembers = flat.members.map((member: any) => {
        const user = users.find((u: any) => u.id === member.userId);
        return {
          ...member,
          user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };
      });
      return { ...flat, members: populatedMembers };
    }

    throw new Error(`Endpoint GET desconocido: ${path}`);
  }

  private handleMockPost(path: string, body: any): any {
    const currentUser = this.getCurrentUser();

    // 1. auth/login
    if (path === 'auth/login') {
      const { email, password } = body;
      const users = this.getLocalStorageData('mock_users') || [];
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error('El usuario no existe');
      if (user.password !== password) throw new Error('Contraseña incorrecta');

      const access_token = btoa(JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }));
      return { access_token };
    }

    // 2. auth/register
    if (path === 'auth/register') {
      const { firstName, lastName, email, password } = body;
      const users = this.getLocalStorageData('mock_users') || [];
      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('El email ya está registrado');
      }

      const newUser = {
        id: `u_${Date.now()}`,
        firstName,
        lastName,
        email,
        password
      };
      users.push(newUser);
      this.setLocalStorageData('mock_users', users);

      const access_token = btoa(JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }));
      return { access_token };
    }

    // 3. flats/create
    if (path === 'flats/create') {
      if (!currentUser) throw new Error('No autorizado');
      const { name } = body;
      if (!name) throw new Error('El nombre es obligatorio');

      const flats = this.getLocalStorageData('mock_flats') || [];
      const newFlat = {
        id: `f_${Date.now()}`,
        name,
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [
          { userId: currentUser.id, role: 'ADMIN' }
        ]
      };
      flats.push(newFlat);
      this.setLocalStorageData('mock_flats', flats);
      return newFlat;
    }

    // 4. flats/join
    if (path === 'flats/join') {
      if (!currentUser) throw new Error('No autorizado');
      const { joinCode } = body;
      if (!joinCode) throw new Error('El código es obligatorio');

      const flats = this.getLocalStorageData('mock_flats') || [];
      const flat = flats.find((f: any) => f.joinCode === joinCode);
      if (!flat) throw new Error('Piso no encontrado');

      if (!flat.members.some((m: any) => m.userId === currentUser.id)) {
        flat.members.push({ userId: currentUser.id, role: 'MEMBER' });
        this.setLocalStorageData('mock_flats', flats);
      }
      return flat;
    }

    // 5. flats/:flatId/tasks/complete
    const taskCompleteMatch = path.match(/^flats\/([^\/]+)\/tasks\/complete$/);
    if (taskCompleteMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const { taskId } = body;
      const tasks = this.getLocalStorageData('mock_tasks') || [];
      const task = tasks.find((t: any) => t.id === taskId);
      if (!task) throw new Error('Tarea no encontrada');

      task.completed = true;
      this.setLocalStorageData('mock_tasks', tasks);
      return { success: true };
    }

    // 6. flats/:flatId/tasks
    const tasksMatch = path.match(/^flats\/([^\/]+)\/tasks$/);
    if (tasksMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = tasksMatch[1];
      const { title, description, frequency, dueDate, assignedToId } = body;

      const tasks = this.getLocalStorageData('mock_tasks') || [];
      const newTask = {
        id: `t_${Date.now()}`,
        flatId,
        title,
        description,
        frequency,
        dueDate,
        assignedToId: assignedToId || null,
        completed: false
      };
      tasks.push(newTask);
      this.setLocalStorageData('mock_tasks', tasks);
      return newTask;
    }

    // 7. flats/:flatId/polls/:pollId/vote
    const voteMatch = path.match(/^flats\/([^\/]+)\/polls\/([^\/]+)\/vote$/);
    if (voteMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const pollId = voteMatch[2];
      const { optionId } = body;

      const polls = this.getLocalStorageData('mock_polls') || [];
      const poll = polls.find((p: any) => p.id === pollId);
      if (!poll) throw new Error('Votación no encontrada');

      if (!poll.votes) poll.votes = [];
      poll.votes = poll.votes.filter((v: any) => v.userId !== currentUser.id);
      poll.votes.push({ userId: currentUser.id, optionId });
      this.setLocalStorageData('mock_polls', polls);
      return { success: true };
    }

    // 8. flats/:flatId/polls
    const pollsMatch = path.match(/^flats\/([^\/]+)\/polls$/);
    if (pollsMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = pollsMatch[1];
      const { question, expiresAt, options } = body;

      const polls = this.getLocalStorageData('mock_polls') || [];
      const newPoll = {
        id: `p_${Date.now()}`,
        flatId,
        question,
        expiresAt,
        options: options.map((optText: string, idx: number) => ({
          id: `o_${Date.now()}_${idx}`,
          text: optText
        })),
        votes: []
      };
      polls.push(newPoll);
      this.setLocalStorageData('mock_polls', polls);
      return newPoll;
    }

    // 9. flats/:flatId/expenses
    const expensesMatch = path.match(/^flats\/([^\/]+)\/expenses$/);
    if (expensesMatch) {
      if (!currentUser) throw new Error('No autorizado');
      const flatId = expensesMatch[1];
      const { title, amount, category, splits } = body;

      const expenses = this.getLocalStorageData('mock_expenses') || [];
      const newExpense = {
        id: `e_${Date.now()}`,
        flatId,
        title,
        amount,
        category,
        payerId: currentUser.id,
        splits
      };
      expenses.push(newExpense);
      this.setLocalStorageData('mock_expenses', expenses);
      return newExpense;
    }

    throw new Error(`Endpoint POST desconocido: ${path}`);
  }
}
