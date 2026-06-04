import { create } from 'zustand';
import { supabase } from '../utils/db';
import { User } from '@supabase/supabase-js';


interface AuthState {
    isloading: boolean,
    user: User | null,
    error: string | null,
    LoginUser: (email: string, password: string) => void
}


const useAuthStore = create<AuthState>((set) => ({
    isloading: false,
    error: null,
    user: null,


    //login function
    LoginUser: async (email, password) => {
        set({ isloading: true })

        try {

            //use supabase built in login feature
            const res = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (res.error) {
                throw res.error
            }
            //store the email and password in the store
            set({
                user: res.data.user
            })
        } catch (error) {
            console.log(error)
        } finally {
            set({ isloading: false })
        }
    }
    
}))

export default useAuthStore