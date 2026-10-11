<?php

namespace Modules\Billing\Services\Imports;

use Generator;
use RuntimeException;

/** Reads phpMyAdmin data literals. SQL from an export is never executed. */
class PerfexSqlReader
{
    public function read(string $path): array
    {
        if (! is_file($path) || ! is_readable($path) || filesize($path) > 256 * 1024 * 1024) {
            throw new RuntimeException('Provide a readable SQL export smaller than 256 MiB.');
        }
        $tables = [];
        foreach ($this->statements(file_get_contents($path)) as $statement) {
            if (preg_match('/^CREATE TABLE(?: IF NOT EXISTS)? `([^`]+)`/i', $statement, $match)) {
                $tables[$match[1]] ??= [];
            } elseif (preg_match('/^INSERT\s/i', $statement)) {
                if (! preg_match('/^INSERT INTO `([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*/i', $statement, $match)) {
                    throw new RuntimeException('Unsupported INSERT syntax in export. No SQL was executed.');
                }
                preg_match_all('/`([^`]+)`/', $match[2], $columns);
                foreach ($this->rows(substr($statement, strlen($match[0]))) as $row) {
                    if (count($row) !== count($columns[1])) {
                        throw new RuntimeException('Column count mismatch in '.$match[1]);
                    }
                    $tables[$match[1]][] = array_combine($columns[1], $row);
                }
            } elseif (preg_match('/^(?:REPLACE|UPDATE|DELETE|LOAD|CALL)\b/i', $statement)) {
                throw new RuntimeException('The export contains unsupported data-changing statements. Export INSERT statements instead.');
            }
        }

        return $tables;
    }

    private function statements(string $sql): Generator
    {
        $buffer = '';
        $quote  = null;
        $length = strlen($sql);
        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $next = $sql[$i + 1] ?? '';
            if ($quote !== null) {
                $buffer .= $char;
                if ($char === '\\' && $quote !== '`' && $i + 1 < $length) {
                    $buffer .= $sql[++$i];
                } elseif ($char === $quote) {
                    if ($next === $quote) {
                        $buffer .= $sql[++$i];
                    } else {
                        $quote = null;
                    }
                }
            } elseif (in_array($char, ["'", '"', '`'], true)) {
                $quote = $char;
                $buffer .= $char;
            } elseif (($char === '-' && $next === '-' && ctype_space($sql[$i + 2] ?? ' ')) || $char === '#') {
                while ($i < $length && $sql[$i] !== "\n") {
                    $i++;
                }
                $buffer .= ' ';
            } elseif ($char === '/' && $next === '*') {
                $end = strpos($sql, '*/', $i + 2);
                if ($end === false) {
                    throw new RuntimeException('Unterminated SQL comment.');
                }
                $i = $end + 1;
                $buffer .= ' ';
            } elseif ($char === ';') {
                if (trim($buffer) !== '') {
                    yield trim($buffer);
                }
                $buffer = '';
            } else {
                $buffer .= $char;
            }
        }
        if ($quote !== null || trim($buffer) !== '') {
            throw new RuntimeException('Incomplete SQL export (unterminated statement or string).');
        }
    }

    private function rows(string $values): Generator
    {
        $i      = 0;
        $length = strlen($values);
        while ($i < $length) {
            $this->whitespace($values, $i);
            if (($values[$i++] ?? '') !== '(') {
                throw new RuntimeException('Expected a literal data row.');
            }
            $row = [];
            do {
                $this->whitespace($values, $i);
                if (($values[$i] ?? '') === "'") {
                    $row[] = $this->string($values, $i);
                } else {
                    $start = $i;
                    while ($i < $length && $values[$i] !== ',' && $values[$i] !== ')') {
                        $i++;
                    }
                    $value = trim(substr($values, $start, $i - $start));
                    if (strtoupper($value) === 'NULL') {
                        $row[] = null;
                    } elseif (preg_match('/^[+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?$/D', $value)) {
                        $row[] = $value;
                    } else {
                        throw new RuntimeException('Unsupported SQL value expression; only strings, numbers and NULL are accepted.');
                    }
                }
                $this->whitespace($values, $i);
                $separator = $values[$i++] ?? '';
                if (! in_array($separator, [',', ')'], true)) {
                    throw new RuntimeException('Invalid SQL value delimiter.');
                }
            } while ($separator === ',');
            yield $row;
            $this->whitespace($values, $i);
            if ($i < $length) {
                if ($values[$i++] !== ',') {
                    throw new RuntimeException('Invalid SQL row delimiter.');
                }
                $this->whitespace($values, $i);
                if ($i >= $length) {
                    throw new RuntimeException('Missing row after trailing comma.');
                }
            }
        }
    }

    private function whitespace(string $value, int &$i): void
    {
        while (isset($value[$i]) && ctype_space($value[$i])) {
            $i++;
        }
    }

    private function string(string $values, int &$i): string
    {
        $i++;
        $result = '';
        while (isset($values[$i])) {
            $char = $values[$i++];
            if ($char === '\\') {
                $escaped = $values[$i++] ?? throw new RuntimeException('Truncated escaped string.');
                $result .= match ($escaped) {
                    '0' => "\0", 'n' => "\n", 'r' => "\r", 't' => "\t", 'b' => "\x08", 'Z' => "\x1a",
                    '_', '%' => '\\'.$escaped,
                    default => $escaped,
                };
            } elseif ($char === "'") {
                if (($values[$i] ?? '') === "'") {
                    $result .= "'";
                    $i++;
                } else {
                    return $result;
                }
            } else {
                $result .= $char;
            }
        }
        throw new RuntimeException('Unterminated SQL string.');
    }
}
