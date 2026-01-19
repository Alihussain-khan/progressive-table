import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ProgressiveJsonTable from './components/ProgressiveJsonTable'
function App() {
  const [count, setCount] = useState(0)

    const sample = [
  { name: "Ali", city: "Stavanger", age: 25 },
  { name: "Sara", city: "Oslo", age: 23 },
  { name: "Jon", city: "Bergen", age: 29 },
];
  return (
    <>



<ProgressiveJsonTable data={sample} />


    </>
  )
}

export default App
