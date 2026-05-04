'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>Error</h1>
        <p>Something went wrong!</p>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
