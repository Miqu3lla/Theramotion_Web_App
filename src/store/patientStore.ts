import { create } from 'zustand'
import { supabase } from '../utils/db' 


interface Patient { 
    id: string,
    first_name?: string,
    last_name?: string,
    affected_area?: string,
    affected_side?: string
}

interface PatientState {
    isLoading: boolean,
    error: string | null,
    patients: Patient[] | null,
    fetchPatients: () => Promise<void>,
}

const usePatientStore = create<PatientState>((set) => ({
    isLoading: false,
    error: null,
    patients: null,
    
    //function to fetch patients
    fetchPatients: async() => {
        set({isLoading: true, error: null})

        try {
            //queries all patient table rows and columns that includes everything 
            const {data, error} = await supabase.from('patients').select('*')

            if(error) throw error

            if(!data) throw new Error('No patients found')

            //sets all patient data to the patients state and sets isLoading to false
            set({patients: data, isLoading: false})


        } catch (error: any) {
            console.error('Error fetching patients:', error);
            set({isLoading: false, error: error.message})
        }
    }
    
    
}))

export default usePatientStore