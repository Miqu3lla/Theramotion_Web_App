import { create } from 'zustand'
import { supabase } from '../utils/db' 


interface Patient { 
    id: string,
    name: string
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


    fetchPatients: async() => {
        set({isLoading: true, error: null})

        try {
            const {data, error} = await supabase.from('patients').select('*')

            if(error) throw error

            if(!data) throw new Error('No patients found')

                if(data) {
                    console.log(data)
                }

            set({patients: data, isLoading: false})


        } catch (error: any) {
            console.error('Error fetching patients:', error);
            set({isLoading: false, error: error.message})
        }
    }
    
    
}))

export default usePatientStore