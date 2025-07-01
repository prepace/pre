'use client';

import React, { useState } from 'react'
import { Graph } from 'graphlib'

export default function Pipeline() {
  const [text,   setText]   = useState('')
  const [graph,  setGraph]  = useState(null)
  const [loading,setLoading]= useState(false)
  const [error,  setError]  = useState(null)

  const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/process'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setGraph(null)

    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { nodes, edges } = await res.json()

      // build graphlib graph
      const g = new Graph({ directed: true })
      for (let n of nodes) {
        g.setNode(n.id, { label: n.label, type: n.type })
      }
      for (let e of edges) {
        g.setEdge(e.source, e.target, { relation: e.relation })
      }
      setGraph(g)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // helpers to pull data out of graphlib graph
  const nodeRows = graph
    ? graph.nodes().map((id, i) => {
        const data = graph.node(id)
        return { key: i, id, label: data.label, type: data.type }
      })
    : []

  const edgeRows = graph
    ? graph.edges().map((e,i) => {
        const data = graph.edge(e)
        return { key: i, source: e.v, relation: data.relation, target: e.w }
      })
    : []

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Letter Graph Pipeline</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={6}
          style={{ width: '100%', padding: 8, fontSize: 14 }}
          placeholder="Paste your full letter (with headers)…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          style={{ marginTop: 8, padding: '8px 16px' }}
        >
          {loading ? 'Processing…' : 'Run Pipeline'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {graph && (
        <>
          <h2>Nodes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Label', 'Type'].map(h => (
                  <th key={h} style={{ border: '1px solid #ccc', padding: 4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodeRows.map(r => (
                <tr key={r.key}>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.id}</td>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.label}</td>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.type}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: '2rem' }}>Edges</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Source', 'Relation', 'Target'].map(h => (
                  <th key={h} style={{ border: '1px solid #ccc', padding: 4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {edgeRows.map(r => (
                <tr key={r.key}>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.source}</td>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.relation}</td>
                  <td style={{ border: '1px solid #eee', padding: 4 }}>{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
