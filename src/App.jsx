
import './App.css'
import ProgressiveJsonTable from './components/ProgressiveJsonTable'
function App() {

    const sample = [
  { name: "Jimmy", city: "Stavanger", age: 25, phone:"83123", adress:"sdashdjk" },
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
