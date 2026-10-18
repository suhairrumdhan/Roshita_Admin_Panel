import {useCallback,useEffect,useRef,useState} from 'react';
import {auth} from './firebase';
export function useAsync(loader,deps=[]){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null);
  const version=useRef(0),mounted=useRef(false);
  const run=useCallback(async()=>{
    const current=++version.current,uid=auth.currentUser?.uid;
    setLoading(true);setError(null);
    try{const value=await loader();if(mounted.current&&current===version.current&&uid===auth.currentUser?.uid)setData(value)}
    catch(failure){if(mounted.current&&current===version.current&&uid===auth.currentUser?.uid)setError(failure)}
    finally{if(mounted.current&&current===version.current&&uid===auth.currentUser?.uid)setLoading(false)}
  },deps);
  useEffect(()=>{mounted.current=true;run();return()=>{mounted.current=false;++version.current}},[run]);
  return{data,loading,error,reload:run,setData};
}
export function useDebounced(value,wait=300){
  const [result,setResult]=useState(value);
  useEffect(()=>{const timer=setTimeout(()=>setResult(value),wait);return()=>clearTimeout(timer)},[value,wait]);
  return result;
}
