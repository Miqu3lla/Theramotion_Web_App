import { create } from 'zustand';
import { supabase } from '../utils/db';
import { User } from '@supabase/supabase-js';


interface AuthState {
    isloading: boolean,
    user: User | null,
    error: string | null,
    LoginUser: (email: string, password: string) => void,
    logoutUser: () => void,

}


const useAuthStore = create<AuthState>((set) => ({
    isloading: false,
    error: null,
    user: null,


    //login function
    LoginUser: async (email, password) => {
        set({ isloading: true, error: null })

        try {

            //use supabase built in login feature
            const {data, error} = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                throw error
            }
            //store the email and password in the store
            set({
                user: data.user
            })
        } catch (error: any) {
            console.error(error)
            set({
                error: error.message || 'an error occured'
            })
        } finally {
            set({ isloading: false })
        }
    },


    logoutUser: async() =>{
        // Clear any prior error so stale login error messages don't persist after logout
        set({ isloading: true, error: null })
        try {
            const{error} = await supabase.auth.signOut()
            if (error) {
                throw error
            }
            set({
                user: null, error: null
            })
        } catch (error: any) {
            console.error(error)
            set({
                error: error.message || 'an error occured'
            })
        } finally {
            set({ isloading: false })
        }
    }
    
    
}))

export default useAuthStore