import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { randomUUID } from 'crypto';

type ModelName =
  | 'users'
  | 'flats'
  | 'rooms'
  | 'flatMember'
  | 'task'
  | 'expense'
  | 'expenseSplit'
  | 'poll'
  | 'pollOption'
  | 'vote'
  | 'chatMessage';

interface DatabaseShape {
  users: any[];
  flats: any[];
  rooms: any[];
  flatMember: any[];
  task: any[];
  expense: any[];
  expenseSplit: any[];
  poll: any[];
  pollOption: any[];
  vote: any[];
  chatMessage: any[];
}

const DEFAULT_DATA: DatabaseShape = {
  users: [],
  flats: [],
  rooms: [],
  flatMember: [],
  task: [],
  expense: [],
  expenseSplit: [],
  poll: [],
  pollOption: [],
  vote: [],
  chatMessage: [],
};

const relationConfig: Record<string, Record<string, any>> = {
  flatMember: {
    user: { model: 'users', localKey: 'userId', foreignKey: 'id', multiple: false },
    flat: { model: 'flats', localKey: 'flatId', foreignKey: 'id', multiple: false },
  },
  task: {
    assignedTo: { model: 'users', localKey: 'assignedToId', foreignKey: 'id', multiple: false },
    createdBy: { model: 'users', localKey: 'createdById', foreignKey: 'id', multiple: false },
    flat: { model: 'flats', localKey: 'flatId', foreignKey: 'id', multiple: false },
  },
  expenseSplit: {
    expense: { model: 'expense', localKey: 'expenseId', foreignKey: 'id', multiple: false },
    user: { model: 'users', localKey: 'userId', foreignKey: 'id', multiple: false },
  },
  expense: {
    paidBy: { model: 'users', localKey: 'paidById', foreignKey: 'id', multiple: false },
    flat: { model: 'flats', localKey: 'flatId', foreignKey: 'id', multiple: false },
    splits: { model: 'expenseSplit', localKey: 'expenseId', foreignKey: 'id', multiple: true },
  },
  poll: {
    options: { model: 'pollOption', localKey: 'pollId', foreignKey: 'id', multiple: true },
    createdBy: { model: 'users', localKey: 'createdById', foreignKey: 'id', multiple: false },
  },
  pollOption: {
    poll: { model: 'poll', localKey: 'pollId', foreignKey: 'id', multiple: false },
    votes: { model: 'vote', localKey: 'pollOptionId', foreignKey: 'id', multiple: true },
  },
  vote: {
    user: { model: 'users', localKey: 'userId', foreignKey: 'id', multiple: false },
    pollOption: { model: 'pollOption', localKey: 'pollOptionId', foreignKey: 'id', multiple: false },
  },
  flat: {
    members: { model: 'flatMember', localKey: 'flatId', foreignKey: 'id', multiple: true },
    rooms: { model: 'rooms', localKey: 'flatId', foreignKey: 'id', multiple: true },
  },
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private filePath = path.resolve(process.cwd(), 'data.xml');
  private data: DatabaseShape = { ...DEFAULT_DATA };

  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    isArray: () => true,
  });

  private builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    suppressEmptyNode: false,
  });

  async onModuleInit() {
    this.load();
  }

  async onModuleDestroy() {
    this.save();
  }

  get user() {
    return this.createModel('users');
  }

  get flat() {
    return this.createModel('flats');
  }

  get rooms() {
    return this.createModel('rooms');
  }

  get flatMember() {
    return this.createModel('flatMember');
  }

  get task() {
    return this.createModel('task');
  }

  get expense() {
    return this.createModel('expense');
  }

  get expenseSplit() {
    return this.createModel('expenseSplit');
  }

  get poll() {
    return this.createModel('poll');
  }

  get pollOption() {
    return this.createModel('pollOption');
  }

  get vote() {
    return this.createModel('vote');
  }

  get chatMessage() {
    return this.createModel('chatMessage');
  }

  async $transaction(cb: (tx: this) => Promise<any>) {
    const result = await cb(this);
    this.save();
    return result;
  }

  private createModel(modelName: ModelName) {
    return {
      create: async ({ data, include, select }: any) => {
        const record = this.createRecord(modelName, data);
        return this.applyResult(modelName, record, include, select);
      },
      findUnique: async ({ where, include, select }: any) => {
        const record = this.findRecord(modelName, where);
        return record ? this.applyResult(modelName, record, include, select) : null;
      },
      findMany: async ({ where, include, select, orderBy }: any = {}) => {
        let records = [...this.data[modelName]];
        if (where) {
          records = records.filter(record => this.matchesWhere(modelName, record, where));
        }
        if (orderBy) {
          records = this.applyOrder(records, orderBy);
        }
        return records.map(record => this.applyResult(modelName, record, include, select));
      },
      findFirst: async ({ where, include, select }: any = {}) => {
        const records = await this.createModel(modelName).findMany({ where, include, select });
        return records[0] || null;
      },
      update: async ({ where, data, include, select }: any) => {
        const record = this.findRecord(modelName, where);
        if (!record) return null;
        this.applyUpdate(record, data);
        this.save();
        return this.applyResult(modelName, record, include, select);
      },
      delete: async ({ where }: any) => {
        const index = this.data[modelName].findIndex(record => this.matchesWhere(modelName, record, where));
        if (index === -1) return null;
        const [deleted] = this.data[modelName].splice(index, 1);
        this.save();
        return deleted;
      },
    };
  }

  private createRecord(modelName: ModelName, data: any) {
    const createdAt = data?.createdAt ? this.normalizeValue(data.createdAt) : new Date().toISOString();
    const record: any = { id: data?.id || randomUUID(), createdAt, updatedAt: createdAt };
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (this.isNestedCreate(key, value)) continue;
        record[key] = this.normalizeValue(value);
      }
    }

    this.data[modelName].push(record);
    if (data) {
      this.handleNestedCreates(modelName, record, data);
    }
    this.save();
    return record;
  }

  private applyUpdate(record: any, data: any) {
    for (const [key, value] of Object.entries(data)) {
      if (this.isNestedCreate(key, value)) continue;
      record[key] = this.normalizeValue(value);
    }
    if ('updatedAt' in record) {
      record.updatedAt = new Date().toISOString();
    }
  }

  private isNestedCreate(key: string, value: any) {
    return value && typeof value === 'object' && 'create' in value;
  }

  private normalizeValue(value: any) {
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  private handleNestedCreates(modelName: ModelName, record: any, data: any) {
    if (modelName === 'flats' && data.members?.create) {
      const nested = Array.isArray(data.members.create) ? data.members.create : [data.members.create];
      nested.forEach((member: any) => {
        this.createModel('flatMember').create({
          data: {
            ...member,
            userId: member.userId,
            flatId: record.id,
          },
        });
      });
    }

    if (modelName === 'poll' && data.options?.create) {
      const nested = Array.isArray(data.options.create) ? data.options.create : [data.options.create];
      nested.forEach((option: any) => {
        this.createModel('pollOption').create({
          data: {
            ...option,
            pollId: record.id,
          },
        });
      });
    }
  }

  private applyResult(modelName: ModelName, record: any, include: any, select: any) {
    let result = { ...record };
    if (include) {
      result = this.applyInclude(modelName, result, include);
    }
    if (select) {
      result = this.applySelect(result, select);
    }
    return result;
  }

  private applySelect(record: any, select: any): any {
    if (!select) return { ...record };
    const selected: any = {};
    for (const [key, value] of Object.entries(select)) {
      if (value === true && key in record) {
        selected[key] = record[key];
      } else if (typeof value === 'object' && record[key] !== undefined) {
        selected[key] = this.applySelect(record[key], value);
      }
    }
    return selected;
  }

  private applyInclude(modelName: ModelName, record: any, include: any): any {
    const result = { ...record };
    for (const [key, value] of Object.entries(include)) {
      if (key === '_count') {
        result._count = this.buildCount(modelName, record, value);
        continue;
      }
      const relation = relationConfig[modelName]?.[key];
      if (!relation) {
        result[key] = record[key];
        continue;
      }
      const related = this.fetchRelation(modelName, key, record, relation, value);
      result[key] = related;
    }
    return result;
  }

  private buildCount(modelName: ModelName, record: any, countSelect: any) {
    const counts: any = {};
    for (const [key, enabled] of Object.entries(countSelect)) {
      if (!enabled) continue;
      const relation = relationConfig[modelName]?.[key];
      if (!relation) continue;
      const related = this.fetchRelation(modelName, key, record, relation, undefined);
      counts[key] = Array.isArray(related) ? related.length : related ? 1 : 0;
    }
    return counts;
  }

  private fetchRelation(modelName: ModelName, key: string, record: any, relation: any, include: any) {
    const target = relation.model as ModelName;
    if (relation.multiple) {
      const list = this.data[target].filter((item: any) => item[relation.localKey] === record[relation.foreignKey]);
      if (include && typeof include === 'object') {
        return list.map((item: any) => this.applyResult(target, item, include.include ?? include, include.select ?? undefined));
      }
      return list;
    }

    const related = this.data[target].find((item: any) => item[relation.foreignKey] === record[relation.localKey]);
    if (!related) return null;
    if (include && typeof include === 'object') {
      return this.applyResult(target, related, include.include ?? include, include.select ?? undefined);
    }
    return related;
  }

  private applyOrder(records: any[], orderBy: any) {
    const [field, direction] = Object.entries(orderBy)[0] as [string, any];
    const order = direction === 'desc' ? -1 : 1;
    return [...records].sort((a, b) => {
      if (a[field] === undefined || b[field] === undefined) return 0;
      const aValue = a[field] instanceof Date ? a[field].getTime() : a[field];
      const bValue = b[field] instanceof Date ? b[field].getTime() : b[field];
      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
  }

  private findRecord(modelName: ModelName, where: any) {
    return this.data[modelName].find(record => this.matchesWhere(modelName, record, where));
  }

  private matchesWhere(modelName: ModelName, record: any, where: any): boolean {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (key.includes('_') && !record.hasOwnProperty(key)) {
          return this.matchesCompoundUnique(record, key, value);
        }
        const relation = relationConfig[modelName]?.[key];
        if (relation) {
          const related = this.fetchRelation(modelName, key, record, relation, undefined);
          if (Array.isArray(related)) {
            return related.some((item: any) => this.matchesWhere(relation.model, item, value));
          }
          return related ? this.matchesWhere(relation.model, related, value) : false;
        }
        return this.matchesWhere(modelName, record[key], value as any);
      }
      return record[key] === value;
    });
  }

  private matchesCompoundUnique(record: any, compoundKey: string, where: any): boolean {
    const keys = compoundKey.split('_');
    return keys.every((key) => {
      if (!(key in where)) {
        return false;
      }
      return record[key] === where[key];
    });
  }

  private normalizeRecord(modelName: ModelName, record: any) {
    const parsed = { ...record };
    const unwrap = (value: any) => Array.isArray(value) ? value[0] : value;
    const parseDate = (value: any) => (typeof value === 'string' ? new Date(value) : value);
    const parseNumber = (value: any) => (typeof value === 'string' && !Number.isNaN(Number(value)) ? Number(value) : value);

    for (const key of Object.keys(parsed)) {
      parsed[key] = unwrap(parsed[key]);
    }

    if ('createdAt' in parsed) parsed.createdAt = parseDate(parsed.createdAt);
    if ('updatedAt' in parsed) parsed.updatedAt = parseDate(parsed.updatedAt);
    if ('deletedAt' in parsed) parsed.deletedAt = parseDate(parsed.deletedAt);
    if ('joinedAt' in parsed) parsed.joinedAt = parseDate(parsed.joinedAt);
    if ('leftAt' in parsed) parsed.leftAt = parseDate(parsed.leftAt);
    if ('dueDate' in parsed) parsed.dueDate = parseDate(parsed.dueDate);
    if ('lastCompleted' in parsed) parsed.lastCompleted = parseDate(parsed.lastCompleted);
    if ('paidAt' in parsed) parsed.paidAt = parseDate(parsed.paidAt);
    if ('expiresAt' in parsed) parsed.expiresAt = parseDate(parsed.expiresAt);
    if ('amount' in parsed) parsed.amount = parseNumber(parsed.amount);
    if ('role' in parsed) parsed.role = String(parsed.role);
    if ('isClosed' in parsed) parsed.isClosed = parsed.isClosed === true || parsed.isClosed === 'true';
    return parsed;
  }

  private normalizeXml(raw: any): DatabaseShape {
    const build = (key: string) => {
      let value = raw[key as keyof typeof raw];
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (!value) return [];
      const nodeName = key === 'flatMember' ? 'flatMember' : key.slice(0, key.length - (key.endsWith('s') ? 1 : 0));
      const items = value[nodeName] || [];
      const list = Array.isArray(items) ? items : [items];
      return list.filter(Boolean).map(item => this.normalizeRecord(key as ModelName, item));
    };

    return {
      users: build('users'),
      flats: build('flats'),
      rooms: build('rooms'),
      flatMember: build('flatMember'),
      task: build('task'),
      expense: build('expense'),
      expenseSplit: build('expenseSplit'),
      poll: build('poll'),
      pollOption: build('pollOption'),
      vote: build('vote'),
      chatMessage: build('chatMessage'),
    };
  }

  private toXmlStructure(data: DatabaseShape) {
    const wrap = (key: string, list: any[]) => {
      const singular = key === 'flatMember' ? 'flatMember' : key.slice(0, key.length - (key.endsWith('s') ? 1 : 0));
      return { [singular]: list.map(item => this.serializeRecord(item)) };
    };

    return {
      users: wrap('users', data.users),
      flats: wrap('flats', data.flats),
      rooms: wrap('rooms', data.rooms),
      flatMember: wrap('flatMember', data.flatMember),
      task: wrap('task', data.task),
      expense: wrap('expense', data.expense),
      expenseSplit: wrap('expenseSplit', data.expenseSplit),
      poll: wrap('poll', data.poll),
      pollOption: wrap('pollOption', data.pollOption),
      vote: wrap('vote', data.vote),
      chatMessage: wrap('chatMessage', data.chatMessage),
    };
  }

  private serializeRecord(record: any) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(record)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value === null || value === undefined) {
        serialized[key] = '';
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  private load() {
    if (!fs.existsSync(this.filePath)) {
      this.data = { ...DEFAULT_DATA };
      this.save();
      return;
    }

    const xml = fs.readFileSync(this.filePath, 'utf8');
    const parsed = this.parser.parse(xml);
    this.data = this.normalizeXml(parsed?.database ?? {});
  }

  private save() {
    const xml = this.builder.build({ database: this.toXmlStructure(this.data) });
    fs.writeFileSync(this.filePath, xml, 'utf8');
  }
}
