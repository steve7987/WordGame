export async function loadWords() {
  const res = await fetch('words.txt');
  const text = await res.text();
  const wordSet = new Set(
    text
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(Boolean)
  );
  return wordSet;
}