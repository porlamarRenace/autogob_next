<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DomPDF Configuration
    |--------------------------------------------------------------------------
    |
    | These options are passed directly to DomPDF. See dompdf documentation for details.
    |
    */

    'show_warnings' => false, // Disable warnings for faster rendering

    'public_path' => null,

    'convert_entities' => true,

    'options' => [
        /**
         * The location of the DOMPDF font directory
         */
        'font_dir' => storage_path('fonts/'),

        /**
         * The location of the DOMPDF font cache directory
         */
        'font_cache' => storage_path('fonts/'),

        /**
         * The location of temporary directory.
         */
        'temp_dir' => sys_get_temp_dir(),

        /**
         * Whether to enable font subsetting or not.
         */
        'enable_font_subsetting' => true,

        /**
         * The PDF rendering backend
         */
        'pdf_backend' => 'CPDF',

        /**
         * pdfa mode (not recommended for performance)
         */
        'pdf_a' => false,

        /**
         * Default media type.
         */
        'default_media_type' => 'screen',

        /**
         * Default paper size.
         */
        'default_paper_size' => 'a4',

        /**
         * Default paper orientation.
         */
        'default_paper_orientation' => 'portrait',

        /**
         * Default font family
         */
        'default_font' => 'serif',

        /**
         * DPI setting
         */
        'dpi' => 96,

        /**
         * Enable embedded PHP
         */
        'enable_php' => false,

        /**
         * Enable inline PHP
         */
        'enable_javascript' => false,

        /**
         * Enable remote file access
         */
        'enable_remote' => false,

        /**
         * Enable HTML5 parser
         */
        'enable_html5_parser' => true,

        /**
         * Enable CSS float
         */
        'enable_css_float' => false,

        /**
         * Use the HTML5 parser
         */
        'isHtml5ParserEnabled' => true,

        /**
         * Allow remote access
         */
        'isRemoteEnabled' => false,

        /**
         * Allow PHP
         */
        'isPhpEnabled' => false,

        /**
         * Validate against W3C
         */
        'debugPng' => false,
        'debugKeepTemp' => false,
        'debugCss' => false,
        'debugLayout' => false,
        'debugLayoutLines' => false,
        'debugLayoutBlocks' => false,
        'debugLayoutInline' => false,
        'debugLayoutPaddingBox' => false,

        /**
         * Chroot
         */
        'chroot' => realpath(base_path()),
    ],
];
