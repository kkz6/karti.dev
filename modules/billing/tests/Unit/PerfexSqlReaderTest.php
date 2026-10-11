<?php

use Modules\Billing\Services\Imports\PerfexSqlReader;

function readPerfexLiteralFixture(string $sql): array
{
    $path = tempnam(sys_get_temp_dir(), 'perfex-test-');
    try {
        file_put_contents($path, $sql);

        return (new PerfexSqlReader)->read($path);
    } finally {
        unlink($path);
    }
}

test('the SQL reader preserves money and handles quoted separators and mysql escapes', function () {
    $tables = readPerfexLiteralFixture(<<<'SQL'
-- Export comment
CREATE TABLE `sample` (`id` int, `text` text, `amount` decimal(19,4), `other` text);
INSERT INTO `sample` (`id`, `text`, `amount`, `other`) VALUES
(1, 'A; B, (C) \'quoted\' \\ path\nnext', 999999999999999.0001, NULL),
(2, 'It''s -- not a comment /* either */', -2.00, '');
SQL);
    expect($tables['sample'][0])->toBe(['id' => '1', 'text' => "A; B, (C) 'quoted' \\ path\nnext", 'amount' => '999999999999999.0001', 'other' => null]);
    expect($tables['sample'][1]['text'])->toBe("It's -- not a comment /* either */");
});

test('the SQL reader rejects executable values and damaged exports', function (string $sql) {
    expect(fn () => readPerfexLiteralFixture($sql))->toThrow(RuntimeException::class);
})->with([
    'INSERT INTO `x` (`id`) VALUES (SLEEP(1));',
    "INSERT INTO `x` (`id`) VALUES ('unterminated);",
    'INSERT INTO `x` (`id`) VALUES (1, 2);',
    'UPDATE `x` SET `id` = 1;',
    'INSERT INTO `x` (`id`) VALUES (1)',
    'INSERT INTO `x` (`id`) VALUES (1),;',
]);
