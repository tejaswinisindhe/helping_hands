
import { create } from 'zustand';

export type Project = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  skills: string[];
  image?: string;
  organizationName: string;
  spots: number;
  filledSpots: number;
};

export type ProjectFilters = {
  search: string;
  skills: string[];
  location: string;
}

type ProjectState = {
  projects: Project[];
  filters: ProjectFilters;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
};

// Mock data for initial development
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Community Garden Cleanup',
    description: 'Help us clean and prepare the community garden for spring planting.',
    location: 'Downtown Community Center',
    startDate: '2025-05-15',
    endDate: '2025-05-15',
    skills: ['gardening', 'physical labor'],
    image: '/images/garden-cleanup.jpg',
    organizationName: 'Green City Initiative',
    spots: 15,
    filledSpots: 8,
  },
  {
    id: '2',
    title: 'Literacy Tutoring',
    description: 'Tutor adults in basic literacy skills to help them improve their reading and writing.',
    location: 'Public Library',
    startDate: '2025-05-20',
    endDate: '2025-08-20',
    skills: ['teaching', 'patience', 'communication'],
    image: '/images/literacy-tutor.jpg',
    organizationName: 'Readers United',
    spots: 10,
    filledSpots: 3,
  },
  {
    id: '3',
    title: 'Food Bank Distribution',
    description: 'Help sort and distribute food to families in need.',
    location: 'Community Food Bank',
    startDate: '2025-05-12',
    endDate: '2025-05-12',
    skills: ['organization', 'physical labor'],
    image: '/images/food-bank.jpg',
    organizationName: 'Feed The Need',
    spots: 20,
    filledSpots: 15,
  },
  {
    id: '4',
    title: 'Website Development',
    description: 'Create a new website for our animal shelter to increase visibility and adoption rates.',
    location: 'Remote',
    startDate: '2025-05-25',
    endDate: '2025-06-25',
    skills: ['web development', 'design', 'programming'],
    image: '/images/website-dev.jpg',
    organizationName: 'Happy Tails Animal Shelter',
    spots: 3,
    filledSpots: 0,
  },
  {
    id: '5',
    title: 'Beach Cleanup',
    description: 'Join us for a day of cleaning up our local beaches to protect marine life.',
    location: 'Sunset Beach',
    startDate: '2025-06-05',
    endDate: '2025-06-05',
    skills: ['environmental awareness', 'physical labor'],
    image: '/images/beach-cleanup.jpg',
    organizationName: 'Clean Ocean Project',
    spots: 50,
    filledSpots: 22,
  },
  {
    id: '6',
    title: 'Elderly Companion',
    description: 'Spend time with seniors at the local retirement home, providing conversation and companionship.',
    location: 'Sunny Days Retirement Home',
    startDate: '2025-05-10',
    endDate: '2025-08-10',
    skills: ['communication', 'empathy', 'patience'],
    image: '/images/elderly-companion.jpg',
    organizationName: 'Silver Years Foundation',
    spots: 25,
    filledSpots: 10,
  },
];

export const useProjectStore = create<ProjectState>((set) => ({
  projects: mockProjects,
  filters: {
    search: '',
    skills: [],
    location: '',
  },
  loading: false,
  error: null,
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would call an API
      // For now, we just use mock data with a small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ projects: mockProjects, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch projects', loading: false });
    }
  },
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },
  resetFilters: () => {
    set({
      filters: {
        search: '',
        skills: [],
        location: '',
      }
    });
  },
}));
