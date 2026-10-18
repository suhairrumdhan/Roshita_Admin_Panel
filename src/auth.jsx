import React,{createContext,useContext,useEffect,useState} from 'react';
import {onIdTokenChanged,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {doc,onSnapshot} from 'firebase/firestore';
import {auth,db} from './firebase';
import {COLLECTIONS} from './config';
const AuthContext=createContext(null);
const PERMISSIONS=new Set(['dashboard.view','requests.view','requests.review','requests.approve','requests.reject','orders.view','pharmacies.view','pharmacies.manage','users.view','alerts.view','coverage.view','reports.view','notifications.view','notifications.send','audit.view']);
export function AuthProvider({children}){
  const [user,setUser]=useState(null),[admin,setAdmin]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  useEffect(()=>{
    let generation=0,stopProfile=()=>{},alive=true;
    const stopAuth=onIdTokenChanged(auth,async current=>{
      const own=++generation;
      stopProfile();stopProfile=()=>{};setUser(null);setAdmin(null);setLoading(!!current);
      if(!current)return;
      async function reject(message){
        if(!alive||own!==generation)return;
        setError(message);setUser(null);setAdmin(null);setLoading(false);await signOut(auth);
      }
      try{
        const token=await current.getIdTokenResult();
        if(!alive||own!==generation)return;
        if(token.claims.actorType==='pharmacy_employee'){await reject('هذا الحساب غير مخول للوحة الإدارة.');return;}
        stopProfile=onSnapshot(doc(db,COLLECTIONS.admins,current.uid),snapshot=>{
          if(!alive||own!==generation)return;
          const profile=snapshot.data();
          if(!snapshot.exists()||profile.isActive!==true){void reject('هذا الحساب غير مخول لاستخدام لوحة الإدارة.');return;}
          setError('');setAdmin({uid:current.uid,email:current.email,name:String(profile.name||'مشرف النظام'),isActive:true});setUser(current);setLoading(false);
        },()=>{void reject('تعذر التحقق من حساب الإدارة. أعد تسجيل الدخول.');});
      }catch{await reject('انتهت جلسة الحساب. سجّل الدخول مجددًا.');}
    });
    return()=>{alive=false;++generation;stopAuth();stopProfile();};
  },[]);
  async function logout(){setUser(null);setAdmin(null);await signOut(auth);}
  return <AuthContext.Provider value={{user,admin,loading,error,can:permission=>admin?.isActive===true&&PERMISSIONS.has(permission),login:(email,password)=>signInWithEmailAndPassword(auth,email,password),logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
