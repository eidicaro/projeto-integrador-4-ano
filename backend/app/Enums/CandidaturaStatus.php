<?php

namespace App\Enums;

enum CandidaturaStatus: string
{
    case New = 'novo';
    case Screening = 'triagem';
    case Interview = 'entrevista';
    case Offer = 'oferta';
    case Hired = 'contratado';
    case Rejected = 'reprovado';
    case Withdrawn = 'retirado';
}
