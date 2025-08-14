<?php

namespace Modules\Media\SourceAdapters;

use GuzzleHttp\Psr7\Utils;
use Modules\Media\Exceptions\MediaUpload\ConfigurationException;

/**
 * Stream resource Adapter.
 *
 * Adapts a stream resource.
 */
class StreamResourceAdapter extends StreamAdapter
{
    /**
     * @var resource
     */
    protected $resource;

    /**
     * Constructor.
     *
     * @param resource $source
     *
     * @throws ConfigurationException
     */
    public function __construct($source)
    {
        if (! is_resource($source) || get_resource_type($source) !== 'stream') {
            throw ConfigurationException::invalidSource('Invalid stream resource');
        }

        parent::__construct(Utils::streamFor($source));

        $this->resource = $source;
    }
}
