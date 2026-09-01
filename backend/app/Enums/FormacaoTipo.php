<?php

namespace App\Enums;

enum FormacaoTipo: string
{
    case ElementarySchool = 'ensino-fundamental';
    case HighSchool = 'ensino-medio';
    case Technical = 'tecnico';
    case Undergraduate = 'graduacao';
    case Technologist = 'tecnologo';
    case Bachelor = 'bacharelado';
    case Licentiate = 'licenciatura';
    case Postgraduate = 'pos-graduacao';
    case Mba = 'mba';
    case Master = 'mestrado';
    case Doctorate = 'doutorado';
    case Postdoctorate = 'pos-doutorado';
    case Other = 'outro';
}
