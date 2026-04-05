const [major] = process.versions.node.split(".").map(Number);

if (major === 22) {
  process.exit(0);
}

if (major === 20) {
  console.warn(
    "Warnung: Node 20 erkannt. Bevorzugt ist Node 22 LTS. Node 20 ist nur als Fallback vorgesehen."
  );
  process.exit(0);
}

console.error(
  `Nicht unterstuetzte Node-Version ${process.version}. Bitte auf Node 22 LTS wechseln. ` +
    "Node 20 LTS ist als Fallback zulaessig."
);
process.exit(1);
