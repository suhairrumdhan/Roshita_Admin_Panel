import {useEffect, useRef, useState} from 'react';
import {adminList} from './services/adminApi';
import {useLocation} from 'react-router-dom';

export function useAdminList(kind, initial = {}) {
  const location = useLocation();
  const defaults = {q: '', state: 'all', group: '', from: '', to: '', delay: '', ...initial};
  const fromUrl = () => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,params.get(key)??value]));
  };
  const lastLocation = useRef(location.search);
  const [filters, setFilters] = useState(fromUrl);
  const [cursors, setCursors] = useState([null]);
  const [index, setIndex] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState({rows: [], hasMore: false, total: 0, next: null});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sequence = useRef(0);
  useEffect(() => {
    if (lastLocation.current === location.search) return;
    lastLocation.current = location.search;
    ++sequence.current; setFilters(fromUrl()); setCursors([null]); setIndex(0); setLoading(true);
  }, [location.search]);
  const queryKey = JSON.stringify(filters);
  const cursorKey = JSON.stringify(cursors[index]);
  useEffect(() => {
    const current = ++sequence.current;
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const result = await adminList(kind, JSON.parse(queryKey), JSON.parse(cursorKey));
        if (active && current === sequence.current) setData(result);
      } catch (failure) {
        if (active && current === sequence.current) setError(failure);
      } finally {
        if (active && current === sequence.current) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [kind, queryKey, cursorKey, revision]);
  function setFilter(key, value) {
    if (filters[key] === value) return;
    ++sequence.current;
    setLoading(true);
    setFilters(current => ({...current, [key]: value}));
    setCursors([null]);
    setIndex(0);
  }
  function reload() { ++sequence.current; setLoading(true); setRevision(value => value + 1); }
  function next() {
    if (loading || !data.hasMore) return;
    ++sequence.current;
    setLoading(true);
    setCursors(current => [...current.slice(0, index + 1), data.next]);
    setIndex(value => value + 1);
  }
  function previous() {
    if (loading || index === 0) return;
    ++sequence.current;
    setLoading(true);
    setIndex(value => value - 1);
  }
  return {data, filters, setFilter, loading, error, reload, index, next, previous};
}
