// This file contains mock implementations of Firebase services for platforms where Firebase is not available
// or for development/testing without a real Firebase connection

// Version to confirm updates (v2)
console.log("Firebase mock implementation version: v2");

// Base mock document data type
export interface MockDocumentData {
  [field: string]: any;
}

// Mock document snapshot
export interface MockDocumentSnapshot {
  id: string;
  exists: boolean;
  data: () => MockDocumentData;
}

// Mock query snapshot
export interface MockQuerySnapshot {
  empty: boolean;
  docs: MockDocumentSnapshot[];
  forEach: (callback: (doc: MockDocumentSnapshot) => void) => void;
}

// More realistic mock data to simulate typical data models
const mockData: { [collection: string]: { [id: string]: any } } = {
  'chores': {
    'mock-chore-1': {
      title: 'Demo Chore: Clean Room',
      description: 'This is a demo chore from the mock implementation',
      points: 10,
      assignedTo: 'mock-user-id',
      assignedToName: 'Demo User',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      familyId: 'mock-family-id'
    },
    'mock-chore-2': {
      title: 'Demo Chore: Do Dishes',
      description: 'Another demo chore from mock implementation',
      points: 5,
      assignedTo: 'mock-user-id',
      assignedToName: 'Demo User',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      familyId: 'mock-family-id'
    }
  },
  'families': {
    'mock-family-id': {
      name: 'Mock Test Family',
      adminId: 'mock-user-id',
      createdAt: new Date(),
      members: [
        {
          uid: 'mock-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin',
          points: 100,
          photoURL: 'https://via.placeholder.com/150'
        }
      ]
    }
  }
};

// Mock Firestore document reference
export class MockDocumentReference {
  id: string;
  path: string;
  private _collection: MockCollectionReference;

  constructor(id: string, collection: MockCollectionReference) {
    this.id = id;
    this._collection = collection;
    this.path = `${collection.path}/${id}`;
  }

  // Get the current document data from our mockData store
  private _getData(): any {
    if (!mockData[this._collection.path]) {
      mockData[this._collection.path] = {};
    }
    return mockData[this._collection.path][this.id] || {};
  }

  // Check if the document exists
  private _exists(): boolean {
    return !!(mockData[this._collection.path] && mockData[this._collection.path][this.id]);
  }

  // Set data for this document
  private _setData(data: any): void {
    if (!mockData[this._collection.path]) {
      mockData[this._collection.path] = {};
    }
    mockData[this._collection.path][this.id] = {
      ...(mockData[this._collection.path][this.id] || {}),
      ...data
    };
  }

  // Simulate retrieving document data
  async get(): Promise<MockDocumentSnapshot> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      id: this.id,
      exists: this._exists(),
      data: () => this._getData()
    };
  }

  // Simulate setting document data (merge update)
  async set(data: MockDocumentData): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this._setData(data);
    
    console.log(`Mock set data for document ${this.path}:`, this._getData());
  }

  // Simulate updating document
  async update(data: MockDocumentData): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!this._exists()) {
      throw new Error(`Cannot update a document that doesn't exist: ${this.path}`);
    }
    
    this._setData(data);
    
    console.log(`Mock update data for document ${this.path}:`, data);
  }

  // Simulate deleting document
  async delete(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (mockData[this._collection.path] && mockData[this._collection.path][this.id]) {
      delete mockData[this._collection.path][this.id];
    }
    
    console.log(`Mock deleted document ${this.path}`);
  }
}

// Mock Firestore query
export class MockQuery {
  private _collection: MockCollectionReference;
  private _filters: Array<{
    field: string;
    operator: string;
    value: any;
  }> = [];

  constructor(collection: MockCollectionReference) {
    this._collection = collection;
  }

  // Add a where clause to the query
  where(field: string, operator: string, value: any): MockQuery {
    this._filters.push({ field, operator, value });
    return this;
  }

  // Apply filters to documents
  private _applyFilters(docs: MockDocumentSnapshot[]): MockDocumentSnapshot[] {
    return docs.filter(doc => {
      // Check if document matches all filters
      return this._filters.every(filter => {
        const docData = doc.data();
        const fieldValue = docData[filter.field];
        
        switch (filter.operator) {
          case '==':
            if (typeof filter.value === 'object' && filter.value !== null) {
              return JSON.stringify(fieldValue) === JSON.stringify(filter.value);
            }
            return fieldValue === filter.value;
          case '!=':
            return fieldValue !== filter.value;
          case '>':
            return fieldValue > filter.value;
          case '>=':
            return fieldValue >= filter.value;
          case '<':
            return fieldValue < filter.value;
          case '<=':
            return fieldValue <= filter.value;
          case 'array-contains':
            return Array.isArray(fieldValue) && fieldValue.some(item => 
              typeof item === 'object' && item !== null
                ? JSON.stringify(item) === JSON.stringify(filter.value)
                : item === filter.value
            );
          default:
            return true;
        }
      });
    });
  }

  // Execute the query and get results
  async get(): Promise<MockQuerySnapshot> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const collectionData = mockData[this._collection.path] || {};
    
    // Convert collection data to documents
    let docs: MockDocumentSnapshot[] = Object.keys(collectionData).map(id => ({
      id,
      exists: true,
      data: () => collectionData[id]
    }));
    
    // Apply filters
    if (this._filters.length > 0) {
      docs = this._applyFilters(docs);
    }
    
    return {
      empty: docs.length === 0,
      docs,
      forEach: (callback) => {
        docs.forEach(callback);
      }
    };
  }
}

// Mock Firestore collection reference
export class MockCollectionReference {
  path: string;

  constructor(path: string) {
    this.path = path;
    console.log(`Created mock collection: ${path}`);
    
    // Initialize collection in mockData if it doesn't exist
    if (!mockData[path]) {
      mockData[path] = {};
    }
  }

  // Get a document reference
  doc(id: string): MockDocumentReference {
    return new MockDocumentReference(id, this);
  }

  // Add a new document with auto-generated ID
  async add(data: MockDocumentData): Promise<{ id: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate a random ID
    const id = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = this.doc(id);
    
    // Set the data
    await docRef.set(data);
    
    console.log(`Added document with auto ID: ${id} to ${this.path}`);
    return { id };
  }

  // Create a query with a where clause
  where(field: string, operator: string, value: any): MockQuery {
    return new MockQuery(this).where(field, operator, value);
  }

  // Get all documents in the collection
  async get(): Promise<MockQuerySnapshot> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const collectionData = mockData[this.path] || {};
    
    // Convert collection data to documents
    const docs: MockDocumentSnapshot[] = Object.keys(collectionData).map(id => ({
      id,
      exists: true,
      data: () => collectionData[id]
    }));
    
    return {
      empty: docs.length === 0,
      docs,
      forEach: (callback) => {
        docs.forEach(callback);
      }
    };
  }
} 