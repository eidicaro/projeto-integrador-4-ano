<?php

namespace App\Enums;

enum UserRole: string
{
    case Candidate = 'candidato';
    case Recruiter = 'recrutador';
}
