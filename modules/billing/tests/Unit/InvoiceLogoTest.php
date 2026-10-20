<?php

use Modules\Billing\Services\InvoiceLogo;

function invoiceLogoDataUri(GdImage $image, string $type = 'png'): string
{
    ob_start();
    try {
        $type === 'jpeg' ? imagejpeg($image) : imagepng($image);

        return 'data:image/'.$type.';base64,'.base64_encode(ob_get_contents());
    } finally {
        ob_end_clean();
        imagedestroy($image);
    }
}

test('invoice logos trim transparent borders and export noise without changing artwork pixels', function () {
    $image = imagecreatetruecolor(80, 50);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
    imagefilledrectangle($image, 20, 15, 59, 34, imagecolorallocatealpha($image, 10, 20, 30, 0));
    imagesetpixel($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 126));
    imagesetpixel($image, 20, 15, imagecolorallocatealpha($image, 50, 100, 150, 60));
    $source = invoiceLogoDataUri($image);

    $result  = app(InvoiceLogo::class)->trim($source);
    $decoded = imagecreatefromstring(base64_decode(explode(',', $result, 2)[1]));
    expect([imagesx($decoded), imagesy($decoded)])->toBe([40, 20]);
    expect(imagecolorsforindex($decoded, imagecolorat($decoded, 0, 0)))
        ->toBe(['red' => 50, 'green' => 100, 'blue' => 150, 'alpha' => 60]);
    expect(imagecolorsforindex($decoded, imagecolorat($decoded, 39, 19)))
        ->toBe(['red' => 10, 'green' => 20, 'blue' => 30, 'alpha' => 0]);
    imagedestroy($decoded);
});

test('palette logos preserve transparent backgrounds when trimmed', function () {
    $image       = imagecreate(60, 40);
    $transparent = imagecolorallocate($image, 255, 255, 255);
    imagecolortransparent($image, $transparent);
    imagefilledrectangle($image, 10, 10, 49, 29, imagecolorallocate($image, 5, 10, 15));
    imagesetpixel($image, 10, 10, $transparent);

    $result  = app(InvoiceLogo::class)->trim(invoiceLogoDataUri($image));
    $decoded = imagecreatefromstring(base64_decode(explode(',', $result, 2)[1]));
    expect([imagesx($decoded), imagesy($decoded)])->toBe([40, 20]);
    expect(imagecolorsforindex($decoded, imagecolorat($decoded, 0, 0))['alpha'])->toBe(127);
    imagedestroy($decoded);
});

test('opaque and entirely transparent logo files are left unchanged', function (string $type) {
    $image = imagecreatetruecolor(10, 10);
    if ($type === 'transparent') {
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
    }
    $source = invoiceLogoDataUri($image, $type === 'jpeg' ? 'jpeg' : 'png');

    expect(app(InvoiceLogo::class)->trim($source))->toBe($source);
})->with(['opaque PNG' => 'png', 'opaque JPEG' => 'jpeg', 'empty transparent PNG' => 'transparent']);
