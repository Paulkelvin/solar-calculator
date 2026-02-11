"use client";

import { useState, useMemo } from "react";
import { Calculator, X } from "lucide-react";

interface QuickCalculatorProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

// Lightweight four-function calculator with sign toggle and percent
// Avoids eval; uses deterministic arithmetic
export function QuickCalculator({ isOpen, onToggle }: QuickCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [pendingOp, setPendingOp] = useState<"+" | "-" | "*" | "/" | null>(null);
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [clearNext, setClearNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setDisplay("0");
    setPendingOp(null);
    setStoredValue(null);
    setClearNext(false);
    setError(null);
  };

  const commitOperation = (op: "+" | "-" | "*" | "/") => {
    if (error) resetAll();
    const current = parseFloat(display);

    if (storedValue === null) {
      setStoredValue(current);
    } else if (pendingOp) {
      const result = calculate(storedValue, current, pendingOp);
      if (Number.isFinite(result)) {
        setStoredValue(result);
        setDisplay(trimResult(result));
      } else {
        setError("Error");
        setDisplay("Error");
        return;
      }
    }

    setPendingOp(op);
    setClearNext(true);
  };

  const handleEquals = () => {
    if (error) {
      resetAll();
      return;
    }

    if (pendingOp === null || storedValue === null) return;

    const current = parseFloat(display);
    const result = calculate(storedValue, current, pendingOp);
    if (Number.isFinite(result)) {
      setDisplay(trimResult(result));
      setStoredValue(null);
      setPendingOp(null);
      setClearNext(true);
    } else {
      setError("Error");
      setDisplay("Error");
    }
  };

  const handleDigit = (digit: string) => {
    if (error) resetAll();
    setDisplay((prev) => {
      if (clearNext || prev === "0") {
        setClearNext(false);
        return digit;
      }
      return prev + digit;
    });
  };

  const handleDecimal = () => {
    if (error) resetAll();
    setDisplay((prev) => {
      if (clearNext) {
        setClearNext(false);
        return "0.";
      }
      if (prev.includes(".")) return prev;
      return prev + ".";
    });
  };

  const handleToggleSign = () => {
    if (error) resetAll();
    setDisplay((prev) => {
      if (prev === "0" || prev === "0.") return prev;
      return prev.startsWith("-") ? prev.slice(1) : `-${prev}`;
    });
  };

  const handlePercent = () => {
    if (error) resetAll();
    const value = parseFloat(display) / 100;
    setDisplay(trimResult(value));
  };

  const trimResult = (value: number) => {
    // Limit floating point noise but keep meaningful digits
    return parseFloat(value.toFixed(10)).toString();
  };

  const calculate = (a: number, b: number, op: "+" | "-" | "*" | "/") => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? Infinity : a / b;
    }
  };

  const buttons: Array<{ label: string; action: () => void; variant?: "accent" | "primary" }>
    = useMemo(() => ([
      { label: "AC", action: resetAll },
      { label: "+/−", action: handleToggleSign },
      { label: "%", action: handlePercent },
      { label: "÷", action: () => commitOperation("/") },
      { label: "7", action: () => handleDigit("7") },
      { label: "8", action: () => handleDigit("8") },
      { label: "9", action: () => handleDigit("9") },
      { label: "×", action: () => commitOperation("*") },
      { label: "4", action: () => handleDigit("4") },
      { label: "5", action: () => handleDigit("5") },
      { label: "6", action: () => handleDigit("6") },
      { label: "−", action: () => commitOperation("-") },
      { label: "1", action: () => handleDigit("1") },
      { label: "2", action: () => handleDigit("2") },
      { label: "3", action: () => handleDigit("3") },
      { label: "+", action: () => commitOperation("+") },
      { label: "0", action: () => handleDigit("0") },
      { label: ".", action: handleDecimal },
      { label: "=", action: handleEquals, variant: "primary" },
    ]), [pendingOp, storedValue, clearNext, error]);

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
            <div className="text-xs uppercase tracking-wide text-emerald-200">Result</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums" aria-live="polite">{display}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {buttons.map((btn) => {
            const isPrimary = btn.variant === "primary";
            const isAccent = btn.variant === "accent";
            return (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                className={`h-12 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                  isPrimary
                    ? "bg-emerald-600 text-white shadow hover:bg-emerald-500 text-lg font-bold"
                    : isAccent
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200"
                } ${btn.label === "0" ? "col-span-2" : ""} ${btn.label === "=" ? "col-span-2" : ""}`}
              >
                  <span className="leading-none">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
