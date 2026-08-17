<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Idioma extends Model
{
    protected $table = 'idiomas';

    protected $fillable = [
        'idioma',
        'nivel',
    ];

    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
