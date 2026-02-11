"use client";

import { useState, useCallback } from "react";
import { Calculator, X } from "lucide-react";

interface QuickCalculatorProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

const OP_SYMBOLS: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

function calc(a: number, b: number, op: string): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? Infinity : a / b;
    default: return b;
  }
}

function trimResult(value: number): string {
  return parseFloat(value.toFixed(10)).toString();
}

export function QuickCalculator({ isOpen, onToggle }: QuickCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState(""); // shows e.g. "8 ×"
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [clearNext, setClearNext] = useState(false);
  const [hasError, setHasError] = useState(false);

  const resetAll = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPendingOp(null);
    setStoredValue(null);
    setClearNext(false);
    setHasError(false);
  }, []);

  const commitOperation = useCallback((op: string) => {
    if (hasError) { resetAll(); return; }
    const current = parseFloat(display);

    if (storedValue === null) {
      setStoredValue(current);
      setExpression(`${display} ${OP_SYMBOLS[op]}`);
    } else if (pendingOp) {
      const result = calc(storedValue, current, pendingOp);
      if (Number.isFinite(result)) {
        setStoredValue(result);
        setDisplay(trimResult(result));
        setExpression(`${trimResult(result)} ${OP_SYMBOLS[op]}`);
      } else {
        setHasError(true);
        setDisplay("Error");
        setExpression("");
        return;
      }
    }

    setPendingOp(op);
    setClearNext(true);
  }, [display, storedValue, pendingOp, hasError, resetAll]);

  const handleEquals = useCallback(() => {
    if (hasError) { resetAll(); return; }
    if (pendingOp === null || storedValue === null) return;

    const current = parseFloat(display);
    const result = calc(storedValue, current, pendingOp);
    if (Number.isFinite(result)) {
      setExpression(`${trimResult(storedValue)} ${OP_SYMBOLS[pendingOp]} ${display} =`);
      setDisplay(trimResult(result));
      setStoredValue(null);
      setPendingOp(null);
      setClearNext(true);
    } else {
      setHasError(true);
      setDisplay("Error");
      setExpression("");
    }
  }, [display, storedValue, pendingOp, hasError, resetAll]);

  const handleDigit = useCallback((digit: string) => {
    if (hasError) resetAll();
    if (clearNext) {
      setClearNext(false);
      setDisplay(digit);
    } else {
      setDisplay((prev) => prev === "0" ? digit : prev + digit);
    }
  }, [clearNext, hasError, resetAll]);

  const handleDecimal = useCallback(() => {
    if (hasError) resetAll();
    if (clearNext) {
      setClearNext(false);
      setDisplay("0.");
    } else {
      setDisplay((prev) => prev.includes(".") ? prev : prev + ".");
    }
  }, [clearNext, hasError, resetAll]);

  const handleToggleSign = useCallback(() => {
    if (hasError) resetAll();
    setDisplay((prev) => {
      if (prev === "0" || prev === "0.") return prev;
      return prev.startsWith("-") ? prev.slice(1) : `-${prev}`;
    });
  }, [hasError, resetAll]);

  const handlePercent = useCallback(() => {
    if (hasError) resetAll();
    const value = parseFloat(display) / 100;
    setDisplay(trimResult(value));
  }, [display, hasError, resetAll]);

  // Button definitions - NO useMemo, just a plain array
  // Each row: [row0], [row1], ... for a 4-column grid
  const buttons = [
    { label: "AC", action: resetAll, style: "top" },
    { label: "+/−", action: handleToggleSign, style: "top" },
    { label: "%", action: handlePercent, style: "top" },
    { label: "÷", action: () => commitOperation("/"), style: "op" },
    { label: "7", action: () => handleDigit("7"), style: "num" },
    { label: "8", action: () => handleDigit("8"), style: "num" },
    { label: "9", action: () => handleDigit("9"), style: "num" },
    { label: "×", action: () => commitOperation("*"), style: "op" },
    { label: "4", action: () => handleDigit("4"), style: "num" },
    { label: "5", action: () => handleDigit("5"), style: "num" },
    { label: "6", action: () => handleDigit("6"), style: "num" },
    { label: "−", action: () => commitOperation("-"), style: "op" },
    { label: "1", action: () => handleDigit("1"), style: "num" },
    { label: "2", action: () => handleDigit("2"), style: "num" },
    { label: "3", action: () => handleDigit("3"), style: "num" },
    { label: "+", action: () => commitOperation("+"), style: "op" },
    { label: "0", action: () => handleDigit("0"), style: "num", span: 2 },
    { label: ".", action: handleDecimal, style: "num" },
    { label: "=", action: handleEquals, style: "eq" },
  ];

  return (
    <div className="pointer-events-none z-50 flex flex-col items-end gap-3 fixed bottom-4 right-4 md:absolute md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:-right-3">
      {/* Protrusion tab */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(!isOpen)}
        className={`pointer-events-auto group flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-emerald-700 shadow-lg transition-all hover:border-emerald-300 hover:shadow-xl ${
          isOpen ? "translate-x-0" : "translate-x-1"
        }`}
      >
        <Calculator className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        <span className="text-sm font-semibold">Calc</span>
      </button>

      {/* Slide-in panel */}
      <div
        className={`pointer-events-auto w-[320px] max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 touch-pan-y ${
          isOpen
            ? "opacity-100 translate-y-0 md:translate-x-[calc(100%+0.75rem)]"
            : "pointer-events-none opacity-0 translate-y-3 md:translate-x-full"
        }`}
        role="dialog"
        aria-label="Quick calculator"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Calculator className="h-4 w-4" aria-hidden="true" /> Quick Calculator
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            onClick={() => onToggle(false)}
            aria-label="Close calculator"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-3">
          <div className="rounded-xl bg-gray-900 px-3 py-4 text-right text-white">
            {/* Expression line: shows e.g. "8 × 5 =" */}
            <div className="text-xs text-emerald-300 min-h-[1.25rem] tabular-nums truncate">
              {expression || "\u00A0"}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums" aria-live="polite">{display}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.action}
              className={`h-12 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                btn.style === "eq"
                  ? "bg-emerald-600 text-white shadow hover:bg-emerald-500 text-lg font-bold"
                  : btn.style === "op"
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-lg font-bold"
                    : btn.style === "top"
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"
              } ${btn.span === 2 ? "col-span-2" : ""}`}
            >
              <span className="leading-none">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
