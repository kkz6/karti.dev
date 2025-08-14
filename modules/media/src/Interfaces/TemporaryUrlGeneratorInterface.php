<?php

namespace Modules\Media\Interfaces;

interface TemporaryUrlGeneratorInterface extends UrlGeneratorInterface
{
    public function getTemporaryUrl(\DateTimeInterface $expiry): string;
}
