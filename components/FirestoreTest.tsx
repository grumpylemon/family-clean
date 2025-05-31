import { isMockImplementation } from '../config/firebase';
import { useAuth } from '../hooks/useZustandHooks';
import { addChore, Chore, getChores, getDefaultFamilyId } from '../services/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

// Version to confirm updates (v11)
console.log("FirestoreTest component version: v11");

// Display version on component for easy verification
const COMPONENT_VERSION = "v11";

// Mock chores for a better demo experience
const MOCK_CHORES: Chore[] = [
  {
    id: 'mock-chore-1',
    title: 'Demo Chore: Clean Room',
    description: 'This is a demo chore from the mock implementation',
    points: 10,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    familyId: 'test-family-id'
  },
  {
    id: 'mock-chore-2',
    title: 'Demo Chore: Do Dishes',
    description: 'Another demo chore from mock implementation',
    points: 5,
    assignedTo: 'mock-user-id',
    assignedToName: 'Demo User',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    familyId: 'test-family-id'
  }
];

export function FirestoreTest() {
  const { user } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('5');
  const [isMock, setIsMock] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingChore, setIsAddingChore] = useState(false);
  
  // Get family ID - use consistent ID for better persistence
  const familyId = getDefaultFamilyId(user?.uid);

  // Handle iOS special case
  const isIOS = Platform.OS === 'ios';
  
  useEffect(() => {
    const mockStatus = isMockImplementation();
    console.log(`FirestoreTest initialized, Platform: ${Platform.OS}, using mock: ${mockStatus}, familyId: ${familyId}`);
    setIsMock(mockStatus);
    
    // For iOS, immediately set mock chores
    if (isIOS && user) {
      console.log("iOS detected, using mock chores");
      setChores(MOCK_CHORES);
      return;
    }
    
    // If using mock but not iOS, set initial demo chores
    if (mockStatus && user && !isIOS) {
      setChores(MOCK_CHORES);
    }
    
    // Always fetch chores on mount for web when signed in
    if (user && !isIOS) {
      console.log("Performing initial fetch of chores");
      fetchChores();
    }
  }, [user, isIOS, familyId]);
  
  const fetchChores = async () => {
    if (!user) return;
    
    // Skip fetching for iOS - just use the mock data already set
    if (isIOS) {
      console.log("Skipping fetch for iOS, using mock data");
      return;
    }
    
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      console.log("Fetching chores for family:", familyId);
      const fetchedChores = await getChores(familyId);
      console.log(`Fetched ${fetchedChores.length} chores:`, 
        fetchedChores.map(c => `${c.id}: ${c.title}`).join(', '));
      
      // Remove any mock/demo chores from the list
      const realChores = fetchedChores.filter(chore => {
        return chore.id && !chore.id.startsWith('mock-chore-');
      });
      
      console.log(`Found ${realChores.length} real chores after filtering demo chores`);
      
      // Only update state if we actually got chores back
      if (fetchedChores && fetchedChores.length > 0) {
        // If using mock mode, include demo chores
        if (isMock) {
          setChores([...MOCK_CHORES, ...realChores]);
        } else {
          setChores(fetchedChores);
        }
      } else if (isMock) {
        // If no chores but mock mode, show demo chores
        setChores(MOCK_CHORES);
        console.log("No chores found in fetch, using demo chores");
      } else {
        console.log("No chores found in fetch, keeping current state");
      }
    } catch (err) {
      setError(`Error fetching chores: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Fetch chores error:', err);
      // If error, show demo chores in mock mode
      if (isMock) {
        setChores(MOCK_CHORES);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleAddChore = async () => {
    if (!user || !title.trim() || isAddingChore) return;
    
    setIsAddingChore(true);
    setLoading(true);
    setError(null);
    try {
      console.log(`Adding chore: ${title}, platform: ${Platform.OS}, family: ${familyId}`);
      
      // Create the chore data
      const newChore: Omit<Chore, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        points: parseInt(points, 10) || 5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        createdAt: new Date(),
        assignedTo: user.uid || 'unknown-user',
        assignedToName: user.displayName || 'Anonymous User',
        familyId: familyId,
      };
      
      // If using mock or iOS, handle locally for better demo
      if (isMock || isIOS) {
        const mockId = `mock-chore-${Date.now()}`;
        console.log(`Created mock chore with ID: ${mockId}`);
        
        // Add to state directly
        setChores(prevChores => [...prevChores, { 
          id: mockId,
          ...newChore
        }]);
      } else {
        // Use the actual service
        const choreId = await addChore(newChore);
        console.log(`Added chore with ID: ${choreId}`);
        
        if (choreId) {
          // Add the new chore to the local state
          const newChoreWithId = {
            id: choreId,
            ...newChore
          };
          
          console.log(`Adding new chore to state: ${newChoreWithId.id} - ${newChoreWithId.title}`);
          
          // Use the functional state update to avoid race conditions
          setChores(prevChores => {
            // Check if this chore is already in the list (by ID)
            const exists = prevChores.some(c => c.id === choreId);
            if (exists) {
              console.log(`Chore ${choreId} already exists in state, not adding duplicate`);
              return prevChores;
            }
            
            const updatedChores = [...prevChores, newChoreWithId];
            console.log(`Updated chores state, now has ${updatedChores.length} items`);
            return updatedChores;
          });
          
          // Do NOT auto refresh - this might be causing the issue
          // by overwriting our state update
        }
      }
      
      // Clear form
      setTitle('');
      setDescription('');
      setPoints('5');
    } catch (err) {
      setError(`Error adding chore: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Add chore error:', err);
    } finally {
      setLoading(false);
      setIsAddingChore(false);
    }
  };
  
  const handleRefresh = () => {
    if (isIOS || isMock) return;
    fetchChores();
  };
  
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to test Firestore</ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.headerContainer}>
        <ThemedText style={styles.title}>
          Firestore Test {isMock ? '(Mock Mode)' : ''} {isIOS ? '(iOS)' : ''} - {COMPONENT_VERSION}
        </ThemedText>
        
        <TouchableOpacity 
          onPress={handleRefresh} 
          disabled={loading || isMock || isIOS}
          style={styles.refreshButton}
        >
          <ThemedText style={[
            styles.refreshText, 
            (isMock || isIOS) && styles.disabledText
          ]}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedText style={styles.familyInfo}>
        Family ID: {familyId}
      </ThemedText>
      
      {/* Add Chore Form */}
      <ThemedView style={styles.formContainer}>
        <ThemedText style={styles.sectionTitle}>Add New Chore</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#999"
          multiline
        />
        
        <TextInput
          style={styles.input}
          placeholder="Points"
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={[
            styles.addButton, 
            (!title.trim() || isAddingChore) && styles.disabledButton
          ]} 
          onPress={handleAddChore}
          disabled={loading || !title.trim() || isAddingChore}
        >
          <ThemedText style={styles.buttonText}>
            {isAddingChore ? 'Adding...' : 'Add Chore'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      {/* Chores List */}
      <ThemedView style={styles.listContainer}>
        <ThemedView style={styles.headerRow}>
          <ThemedText style={styles.sectionTitle}>
            Chores ({chores.length})
          </ThemedText>
          
          {loading && <ActivityIndicator size="small" color="#A1CEDC" />}
        </ThemedView>
        
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        
        {chores.length === 0 && !loading ? (
          <ThemedText style={styles.emptyText}>No chores found</ThemedText>
        ) : (
          chores.map((chore) => (
            <ThemedView key={chore.id} style={styles.choreItem}>
              <ThemedText style={styles.choreTitle}>{chore.title}</ThemedText>
              {chore.description && (
                <ThemedText style={styles.choreDescription}>{chore.description}</ThemedText>
              )}
              <ThemedView style={styles.choreDetails}>
                <ThemedText style={styles.chorePoints}>{chore.points} points</ThemedText>
                <ThemedText style={styles.choreDate}>
                  Due: {new Date(chore.dueDate instanceof Date ? chore.dueDate : new Date(chore.dueDate)).toLocaleDateString()}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.choreAssignee}>
                Assigned to: {chore.assignedToName || 'Unknown'}
              </ThemedText>
              <ThemedText style={styles.choreId}>
                ID: {chore.id}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(161, 206, 220, 0.1)',
    marginVertical: 16,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  familyInfo: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshText: {
    color: '#4285F4',
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
  listContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 8,
  },
  errorText: {
    color: '#FF6B6B',
    marginVertical: 8,
  },
  choreItem: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    marginBottom: 8,
  },
  choreTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  choreDescription: {
    marginBottom: 8,
    opacity: 0.8,
  },
  choreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chorePoints: {
    fontWeight: 'bold',
    color: '#4285F4',
  },
  choreDate: {
    opacity: 0.7,
  },
  choreAssignee: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  choreId: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 4,
  },
}); 