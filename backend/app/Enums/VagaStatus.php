<?php

namespace App\Enums;

enum VagaStatus: string
{
    case Draft = 'rascunho';
    case Published = 'publicada';
    case Paused = 'pausada';
    case Archived = 'arquivada';
    case Closed = 'encerrada';
}
